use std::borrow::{Borrow, BorrowMut};
use std::default::Default;
use std::{clone, io, result, vec};

use crate::command::TypeOr;
use chrono::NaiveDateTime;
use html5ever::tendril::TendrilSink;
use html5ever::{parse_document, QualName};
use rcdom::{Handle, NodeData, RcDom};
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
        }
    }
}

pub struct parse_html_return {
    pub parsed_text: Vec<Vec<String>>,
    pub formula_list: Vec<formula>,
    pub tags: Vec<String>,
}

pub fn convert_to_formula(formula: String, entry_no: u64) -> formula {
    return formula {
        line: 0,
        formula: formula,
        entry: entry_no,
        id: Uuid::new_v4().to_string(),
        data: TypeOr::NotCalculated,
        isSorting: true,
    };
}

pub fn parse_html(html: &str) -> parse_html_return {
    // split the html by <hr> tag
    // split by <hr> <hr/> and <hr />

    let split = ["<hr>", "<hr/>", "<hr />"];
    let final_string: String;
    let tags = html.split("<hr>").collect::<Vec<&str>>();

    let mut parsed_text = vec![];
    let mut formula_list: Vec<formula> = vec![];
    let mut entry = 0;
    for tag in tags.iter() {
        let mut line = 0;
        let dom = parse_document(RcDom::default(), Default::default()).one(tag.to_string());
        let final_data = walk(&dom.document, false, &mut formula_list, &mut line, entry);
        parsed_text.push(final_data);
        entry += 1;
    }

    parse_html_return {
        parsed_text,
        formula_list,
        tags: tags.iter().map(|x| x.to_string()).collect(),
    }
}
