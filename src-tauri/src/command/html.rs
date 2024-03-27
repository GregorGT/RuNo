use std::borrow::{Borrow, BorrowMut};
use std::default::Default;
use std::{clone, io, result, vec};

use crate::command::TypeOr;
use chrono::NaiveDateTime;
use html5ever::parse_document;
use html5ever::serialize::SerializeOpts;
use html5ever::tendril::TendrilSink;
use rcdom::{Handle, NodeData, RcDom, SerializableHandle};
use scraper::html;
use uuid::Uuid;

fn walk(
    handle: &Handle,
    is_in_line: bool,
    formula_list: &mut Vec<formula>,
    line: &mut u64,
    entry: u64,
) -> Vec<String> {
    let node = handle;
    let mut is_p = is_in_line;
    match node.data {
        NodeData::Text { ref contents } => {
            // String data of a text node
            return vec![contents.borrow().to_string()];
        }
        NodeData::Element {
            ref name,
            ref attrs,
            ..
        } => {
            if &*name.local == "formula" {
                let mut id: String = "".to_string();
                let mut formula: String = "".to_string();
                for attr in attrs.borrow().iter() {
                    if &*attr.name.local == "id" {
                        id = attr.value.to_string();
                    }
                    if &*attr.name.local == "formula" {
                        formula = attr.value.to_string();
                    }
                }

                for child in node.children.borrow().iter() {
                    match child.data {
                        NodeData::Text { ref contents } => {
                            formula = contents.borrow().to_string();
                        }
                        _ => {}
                    }
                }
                if formula.len() == 0 || id.len() == 0 {
                    return vec![];
                }

                formula_list.push(formula {
                    line: *line,
                    formula: formula,
                    entry: entry,
                    id: id.clone(),
                    data: TypeOr::NotCalculated,
                    isSorting: false,
                    isFilter: false,
                });

                return vec![id.to_string()];
            }

            if &*name.local == "hr" {
                // return vec!["<hr/>".to_string()];
                // HR means new entry
            }
            if &*name.local == "p" {
                is_p = true;
                *line = *line + 1;
            }
        }
        _ => {}
    }

    let mut result: Vec<String> = vec![];
    for child in node.children.borrow().iter() {
        result.append(&mut walk(child, is_p, formula_list, line, entry));
    }

    if is_p && result.len() > 0 {
        return vec![result.join("")];
    }
    result
}
#[derive(Debug, serde::Serialize, PartialEq, PartialOrd)]
pub struct formula {
    pub line: u64,
    pub formula: String,
    pub entry: u64,
    pub id: String,
    pub data: TypeOr<String, f64, NaiveDateTime>,
    pub isSorting: bool,
    pub isFilter: bool,
}

impl Clone for formula {
    fn clone(&self) -> Self {
        formula {
            line: self.line,
            formula: self.formula.clone(),
            entry: self.entry,
            id: self.id.clone(),
            data: self.data.clone(),
            isSorting: self.isSorting,
            isFilter: self.isFilter,
        }
    }
}

#[derive(Debug, serde::Serialize, PartialEq, PartialOrd, Clone)]
pub struct entry_data {
    pub entry: u64,
    pub ids: Vec<String>,
}
pub struct parse_html_return {
    pub parsed_text: Vec<entry_data>,
    pub formula_list: Vec<formula>,
    pub tags: Vec<String>,
    pub index_data: Vec<Vec<String>>,
}

pub fn convert_to_sorting_formula(formula: String, entry_no: u64) -> formula {
    return formula {
        line: 0,
        formula: formula,
        entry: entry_no,
        id: Uuid::new_v4().to_string(),
        data: TypeOr::NotCalculated,
        isSorting: true,
        isFilter: false,
    };
}
pub fn convert_to_filter_formula(formula: String, entry_no: u64) -> formula {
    return formula {
        line: 0,
        formula: formula,
        entry: entry_no,
        id: Uuid::new_v4().to_string(),
        data: TypeOr::NotCalculated,
        isSorting: false,
        isFilter: true,
    };
}
use std::collections::HashSet;

pub static mut ENTRY_LIST: Vec<entry_data> = vec![];

fn extract_hr_ids_recursive(node: Handle, hr_ids: &mut HashSet<String>) {
    let node_data = node.data.borrow();
    if let NodeData::Element { name, attrs, .. } = &*node_data {
        if name.local.to_lowercase() == "hr" {
            for attr in attrs.borrow().iter() {
                unsafe {
                    ENTRY_LIST.push(entry_data {
                        entry: ENTRY_LIST.len() as u64,
                        ids: vec![],
                    });
                }
            }
        } else if name.local.to_lowercase() == "head"
            || name.local.to_lowercase() == "body"
            || name.local.to_lowercase() == "html"
        {
            // do nothing
        } else {
            // remove <head></head> <body></body> tags
            // data = data.replace("<head></head>", "");

            // println!("Data: {:?}", bytes);
            // convert bytes to string

            if (name.local.to_lowercase() == "p" || name.local.to_lowercase() == "div") {
                unsafe {
                    //find id from attributes
                    let mut id = "".to_string();
                    for attr in attrs.borrow().iter() {
                        if attr.name.local.to_lowercase() == "id" {
                            id = attr.value.to_string();
                        }
                    }

                    if (id.len() > 0) {
                        ENTRY_LIST.last_mut().unwrap().ids.push(id);
                    }
                }
            }
        }
    }

    for child in node.children.borrow().iter() {
        extract_hr_ids_recursive(child.clone(), hr_ids);
    }
}

pub fn parse_html(html: &str) -> parse_html_return {
    unsafe {
        ENTRY_LIST = vec![];
    }

    let dom = parse_document(RcDom::default(), Default::default()).one(html.to_string());

    // Extract <hr> tag IDs recursively
    let mut hr_ids = HashSet::new();
    extract_hr_ids_recursive(dom.document, &mut hr_ids);

    // Print the extracted IDs
    println!("Extracted HR IDs: {:?}", hr_ids);

    // ///////////////////
    let delimiters = ["<hr>", "<hr/>", "<hr />", "<hr class=\"hidden\">"];
    let final_string: String;

    let saperated_hr = parse_document(RcDom::default(), Default::default()).one(html.to_string());
    // let tag_data = vec![];

    let mut formula_list: Vec<formula> = vec![];
    let mut index_data = vec![];
    let mut entry = 0;
    let mut tags = html.split("<hr>").collect::<Vec<&str>>();

    unsafe {
        for tag in tags.iter() {
            let mut line = 0;
            let dom = parse_document(RcDom::default(), Default::default()).one(tag.to_string());
            let final_data = walk(&dom.document, false, &mut formula_list, &mut line, entry);
            index_data.push(final_data);
            entry += 1;
        }
    }

    unsafe {
        println!("Entry List: {:?}", ENTRY_LIST);
    }

    unsafe {
        parse_html_return {
            parsed_text: ENTRY_LIST.clone(),
            formula_list,
            tags: tags.iter().map(|x| x.to_string()).collect(),
            index_data,
        }
    }
}
