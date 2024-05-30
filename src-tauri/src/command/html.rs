use std::borrow::{Borrow, BorrowMut};
use std::default::Default;
use std::{clone, io, result, vec};

use crate::command::{TypeOr, ORIGINAL_DOC_ID_LIST};
use chrono::NaiveDateTime;
use html5ever::parse_document;
use html5ever::serialize::{Serialize, SerializeOpts, TraversalScope};
use html5ever::tendril::TendrilSink;
use rcdom::{Handle, Node, NodeData, RcDom, SerializableHandle};
use scraper::html;
use std::collections::LinkedList;
use tauri::utils::html::NodeRef;
use uuid::Uuid;

use super::ENTRY_IDS;

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
    pub tags: Vec<Vec<String>>,
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

pub static mut ENTRY_LIST: Vec<entry_data> = vec![];

#[derive(Debug, serde::Serialize, PartialEq, PartialOrd, Clone)]
pub struct list_ids {
    pub ids: LinkedList<String>,
    pub entry: u64,
}
static mut HIGHEST_ENTRY: i64 = -1;

pub fn get_highest_data_index_recursive(node: &Handle) {
    let node_data = node.data.borrow();
    if let NodeData::Element { name, attrs, .. } = &*node_data {
        if name.local.to_lowercase() == "hr" {
            attrs.borrow().iter().for_each(|attr| {
                if attr.name.local.to_lowercase() == "data-index" {
                    unsafe {
                        let value = attr.value.parse::<i64>().unwrap();
                        if value + 1 > HIGHEST_ENTRY {
                            HIGHEST_ENTRY = value + 1;
                        }
                    }
                }
            });
        }
    }
    for child in node.children.borrow().iter() {
        get_highest_data_index_recursive(child);
    }
}

pub fn extract_all_ids_recursive(
    node: &Handle,
    ids: &mut LinkedList<list_ids>,
    tags: &mut Vec<Vec<String>>,
) {
    let node_data = node.data.borrow();

    if let NodeData::Element { name, attrs, .. } = &*node_data {
        /// valids tags are p ,div, hr, span, table
        let valid_tags = ["p", "div", "hr", "span", "table", "formula"];

        if valid_tags.contains(&&*name.local.to_lowercase().as_str()) {
            if name.local.to_lowercase() == "div" {
              //  println!("DIV: {:?}", attrs.borrow().iter().collect::<Vec<_>>());
            }

            if name.local.to_lowercase() == "hr" {
                tags.push(vec![]);
                // value of id
                let id = attrs
                    .borrow()
                    .iter()
                    .find(|x| x.name.local.to_lowercase() == "id")
                    .unwrap()
                    .value
                    .to_string();

                // location of id in ENTRY_IDS
                let mut index = 0;
                unsafe {
                    for entry in ENTRY_IDS.iter() {
                        if entry.to_string() == id {
                            break;
                        }
                        index += 1;
                    }
                }

                let mut ll = LinkedList::new();
                ll.push_back(id);
                ids.push_back({
                    list_ids {
                        ids: ll,
                        entry: index as u64,
                    }
                })
            } else {
                for attr in attrs.borrow().iter() {
                    if attr.name.local.to_lowercase() == "id" {
                        ids.back_mut()
                            .unwrap()
                            .ids
                            .push_back(attr.value.to_string());
                        // ids.push_back(attr.value.to_string());
                    }
                }
            }

            let current_hr_id = ids.back().unwrap().ids.front().unwrap().to_string();
            // change attribute value of HR
           // println!("CURRENT HR ID: {:?}", current_hr_id);
            let mut index = 0;
            unsafe {
                //loop through entry ids
                for entry in ENTRY_IDS.iter() {
                    if entry.to_string() == current_hr_id.to_string() {
                        break;
                    }
                    index += 1;
                }
            }

            // if tag is p get html content
            // get html content
            let mut dom = RcDom::default();
            dom.document
                .borrow_mut()
                .children
                .borrow_mut()
                .push(node.clone());

            let mut bytes = vec![];
            html5ever::serialize::serialize::<_, SerializableHandle>(
                &mut bytes,
                &SerializableHandle::from(dom.document), // Fix: Pass a reference to dom.document
                SerializeOpts::default(),
            )
            .unwrap();

            //convert bytes to stirng
            let data = String::from_utf8(bytes).unwrap();

            //push to the last on tagss
            // tags.last_mut().unwrap().push(data);
            //find mutable at index and push data

            if index < tags.len() {
                tags[index].push(data);
            } else {
                while index >= tags.len() {
                    tags.push(vec![]);
                }
                tags[index].push(data);
            }
        }
    }
    for child in node.children.borrow().iter() {
        extract_all_ids_recursive(child, ids, tags);
    }
}

pub fn parse_html(html: &str) -> parse_html_return {
    unsafe {
        ENTRY_LIST = vec![];
        HIGHEST_ENTRY = -1;
    }

    let dom = parse_document(RcDom::default(), Default::default()).one(html.to_string());

    let mut linkdlist = LinkedList::new();
    let mut tags: Vec<Vec<String>> = vec![];
    // get_highest_data_index_recursive(&dom.document);
    unsafe {
       // println!("HIGHEST ENTRY: {:?}", HIGHEST_ENTRY);
    }

    extract_all_ids_recursive(&dom.document, &mut linkdlist, &mut tags);

    //
    // println!("{:?}", linkdlist);
    // ///////////////////

    // let tag_data = vec![];
    // println!("{:?}", tags);

    let mut formula_list: Vec<formula> = vec![];
    let mut index_data = vec![];
    let mut entry = 0;

    unsafe {
        for tag in tags.iter() {
            let mut line = 0;
            let dom =
                parse_document(RcDom::default(), Default::default()).one(tag.concat().to_string());
            let final_data = walk(&dom.document, false, &mut formula_list, &mut line, entry);
            index_data.push(final_data);
            entry += 1;
        }
    }

    unsafe {
        ORIGINAL_DOC_ID_LIST = linkdlist;
    }

    unsafe {
        parse_html_return {
            parsed_text: ENTRY_LIST.clone(),
            formula_list,
            tags: tags,
            index_data,
        }
    }
}
