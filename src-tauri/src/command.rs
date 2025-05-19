//extern crate msgbox;

use serde::de::value;
//use msgbox::IconType;
use serde::Serialize;
use std::cmp::Ordering;
use std::panic;
use tauri::Result;

use std::sync::Mutex;
use tauri::State;
//use tauri::api::dialog::*; // Add tihs
use tauri_plugin_dialog::DialogExt;

use std::collections::{HashMap, LinkedList};
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
use std::time::Instant;

use chrono::{NaiveDateTime, NaiveTime};
use dateparser::parse;
use pest::iterators::Pair;
use pest::Parser;
use regex::Regex;
use round::round;
use std::path::Path;
use std::{fs, result, string, vec};
use tantivy::collector::{Count, TopDocs};
use tantivy::directory::{MmapDirectory, RamDirectory};
use tantivy::query::{Exclude, Intersection, PhrasePrefixQuery, PhraseQuery};
use tantivy::{doc, Directory, DocAddress, Index, ReloadPolicy};
use tantivy::{schema::*, Searcher};
use tauri::{path::BaseDirectory, Manager};
use try_catch::catch;

use self::html::{entry_data, list_ids};

mod applicationdialogs;
mod applicationdirs;
mod documents;
mod html;
mod utils;

//use get_application_path;
use applicationdialogs::msg_box;
use applicationdirs::get_application_db_directory;

static mut FORMULA_LIST_CELL: Vec<html::formula> = vec![];
static mut TABLE_LIST_CELL: Vec<html::table> = vec![];
pub static mut ORIGINAL_DOC_ID_LIST: LinkedList<list_ids> = LinkedList::new();
//
const LENGTH: i32 = 1;


#[derive(Debug, serde::Serialize, PartialEq, PartialOrd)]
pub struct return_data {
    formula_list: Vec<html::formula>,
    sorted: String,
    filtered: Vec<String>,
    parsed_text: String,
    is_error: bool,
    tables: Option<Vec<html::table>>,
}

static mut ENTRY_DATA: Vec<entry_data> = vec![];

static mut ENTRY_IDS: Vec<String> = vec![];

static mut TABLE_DATA_LIST: Vec<html::TableData> = vec![];

#[tauri::command]
pub fn clear_entry_id() {
    unsafe {
        ENTRY_IDS = vec![];
    }
}

#[tauri::command]
pub fn assign_entry_id(entry_id: String, top_id: String) {
    unsafe {
        // FInd entry id in the list
        for entry in ENTRY_IDS.clone() {
            if entry == entry_id {
                return;
            }
        }

        if (top_id == "") {
            ENTRY_IDS.push(entry_id);
        } else {
            // Add entry id after top_id
            let mut index = 0;
            let mut top_id_found = false;
            for (i, id) in ENTRY_IDS.iter().enumerate() {
                if id == &top_id {
                    index = i;
                    top_id_found = true;
                    break;
                }
            }

            if !top_id_found {
                ENTRY_IDS.push(top_id);
                ENTRY_IDS.push(entry_id);
            } else {
                ENTRY_IDS.insert(index + 1, entry_id);
            }
        } // REmove duplicate entry id
        ENTRY_IDS.dedup();

        //   println!("Entry Ids: {:?}", ENTRY_IDS);
    }
}

/*

    HTML Buffer
    1. parse_html -> list of entry
    2. we add sorting and filtering function to each entry
    3. we collect all the formula functions and run them
    4. we do sorting in the backend with parsed the html
    5. we create list of ids to be hidden for filtering
    6. we return sortedBuffer , filterdBuffer , ParsedText


*/

/*

 Approch 2
    HTML Buffer
        1. Id in index to UUID of entry
        2. filter + formula

            10,000 entries
            after filtering we have 5000 entries

        3. sorting on filtered entries
*/

/*

Entries  buffer




*/


#[tauri::command]
pub fn run_command(
    input: String,
    sorting: String,
    sorting_up: bool,
    filter: String,
    tables: Option<Vec<html::table>>,
) -> return_data {
    let result =
        panic::catch_unwind(
            || match main_command(input.clone(), sorting, sorting_up, filter, tables) {
                Ok(data) => data,
                Err(err) => {
                    println!("Error: {:?}", err);
                    return return_data {
                        formula_list: vec![],
                        sorted: "".to_string(),
                        filtered: vec![],
                        parsed_text: "".to_string(),
                        is_error: true,
                        tables: vec![].into(),
                    };
                }
            },
        );
    if result.is_err() {
        // msgbox::create("Error", "Error in the formula", IconType::Error);
        applicationdialogs::msg_box("Error in formula".to_string());
        //"ぼくRust!".into()

        return return_data {
            formula_list: vec![],
            sorted: "".to_string(),
            filtered: vec![],
            is_error: true,
            parsed_text: input.to_string(),
            tables: vec![].into(),
        };
    }
    return result.unwrap();
}

//mod main;
//use main::get_application_path;

pub fn main_command(
    input: String,
    sorting: String,
    sorting_up: bool,
    filter: String,
    tables: Option<Vec<html::table>>,
) -> Result<return_data> {
    let SINGLE_LINE_EXAMPLE: &str = input.as_str();

    let mut sorting_fn = if sorting.clone().trim() == "" {
        r#"EVAL(!"ID: {NUMBER}")"#.to_string()
    } else {
        sorting.clone()
    };
    let input_filter_fn = if filter.trim() == "" {
        r#"EVAL(!"ID: {NUMBER}") = 1"#.to_string()
    } else {
        filter.clone()
    };
    let filterFn = format!("IF({}){{SUM(1)}}ELSE{{SUM(2)}}", input_filter_fn);

    let start_time = Instant::now();

    let parsed_data: html::parse_html_return =
        html::parse_html(SINGLE_LINE_EXAMPLE.repeat(LENGTH as usize).as_str());

    unsafe {
        TABLE_DATA_LIST = parsed_data.table_list.clone();
    }

    let SEPARATED_DOCS = parsed_data.parsed_text;

    unsafe { ENTRY_DATA = SEPARATED_DOCS }

    let all_html = parsed_data.tags;
    print!("All HTML: {:?}", all_html.len());
    let mut sorting_formula_list = vec![];
    if sorting.trim().len() > 1 {
        sorting_formula_list = all_html
            .clone()
            .into_iter()
            .enumerate()
            .map(|(index, x)| {
                html::convert_to_sorting_formula(sorting_fn.to_string(), index as u64)
            })
            .collect::<Vec<html::formula>>();
    }
    let mut filter_formula_list = vec![];

    if filter.trim().len() > 1 {
        filter_formula_list = all_html
            .clone()
            .into_iter()
            .enumerate()
            .map(|(index, x)| html::convert_to_filter_formula(filterFn.to_string(), index as u64))
            .collect::<Vec<html::formula>>();
    }

    let formula_list = parsed_data.formula_list;
    //SET GLOBAL LIST FOR FORMULA
    unsafe {
        // merge formula list and sorting formula list
        let mut formula_list = formula_list.clone();
        formula_list.extend(sorting_formula_list.clone());
        formula_list.extend(filter_formula_list.clone());
        FORMULA_LIST_CELL = formula_list.clone();
        TABLE_LIST_CELL = tables.clone().unwrap_or_default();
    }

    let end_time = Instant::now();
    println!(
        "Time taken For Parsing: {:?}",
        end_time.duration_since(start_time)
    );
    // return;
    // documents::strip_html(EXAMPLE.to_string());
    // return;

    /////// celar all the content of data dir
    ///
    // let local_data_dir_path = (local_data_dir().unwrap()).join("runo");
    let local_data_dir_path = get_application_db_directory(); // = get_application_path().unwrap().join("runo");
                                                              // let _ = local_data_dir_path.join("runo");
                                                              // let path = Path::new(local_data_dir_path);

    if local_data_dir_path.exists() {
        fs::remove_dir_all(local_data_dir_path.clone()).unwrap()
    }

    if !local_data_dir_path.exists() {
        fs::create_dir_all(local_data_dir_path.clone())?;
    }

    // fs::create_dir_all(local_data_dir_path).unwrap();

    // Ram storage
    let ram_dir = RamDirectory::create();
    let global_index = documents::get_schema(ram_dir.clone()).unwrap();

    // START INDEXING
    let start_time = Instant::now();
    // let separated_docs = documents::break_html(EXAMPLE.repeat(LENGTH as usize).as_str());
    unsafe {
        let _ = documents::add_inital_docs(
            ram_dir.to_owned(),
            parsed_data
                .index_data
                .clone()
                .into_iter()
                .collect::<Vec<Vec<String>>>(),
        );
    }

    ram_dir
        .persist(&MmapDirectory::open(local_data_dir_path).unwrap())
        .unwrap();
    ram_dir.sync_directory().unwrap();
    let end_time = Instant::now();
    println!(
        "Time taken For Indexing: {:?}",
        end_time.duration_since(start_time)
    );
    //INDEXING DONE

    // All Data Is Saved Now We Can use that data to search
    let schema = global_index.schema();
    let body = schema.get_field("body").unwrap();

    let reader = global_index
        .reader_builder()
        .reload_policy(ReloadPolicy::OnCommit)
        .try_into()
        .unwrap();

    let searcher = reader.searcher();
    let start_query_time = Instant::now();
    let new_list = formula_list.clone();
    // println!("{:?}", formula_list);
    // println!("Formula List Length: {:?}", formula_list.len());
    unsafe {
        let list = FORMULA_LIST_CELL.clone();

        for formula in list.clone() {
            if formula.data != TypeOr::NotCalculated {
                continue;
            }

            let out = parse_string(
                formula.clone(),
                documents::get_searcher(global_index.clone()).unwrap(),
                schema.clone(),
                new_list.clone(),
            );

            // println!("Final : {:?}", out);
        }
    }

    let end_query_time = Instant::now();
    println!(
        "Time taken For Query: {:?}",
        end_query_time.duration_since(start_query_time)
    );

    unsafe {
        let mut only_sorting_functions = FORMULA_LIST_CELL
            .clone()
            .into_iter()
            .filter(|x| x.isSorting)
            .collect::<Vec<html::formula>>();

        only_sorting_functions.sort_by(|a, b| {
            let a = a.data.clone();
            let b = b.data.clone();
            match (a, b) {
                (TypeOr::Right(a), TypeOr::Right(b)) => a.partial_cmp(&b).unwrap(),
                (TypeOr::RightList(a), TypeOr::RightList(b)) => {
                    let a = a.iter().sum::<f64>();
                    let b = b.iter().sum::<f64>();
                    a.partial_cmp(&b).unwrap()
                }
                (TypeOr::Left(a), TypeOr::Left(b)) => a.partial_cmp(&b).unwrap(),
                (TypeOr::LeftList(a), TypeOr::LeftList(b)) => {
                    let a = a.join("");
                    let b = b.join("");
                    a.partial_cmp(&b).unwrap()
                }
                (TypeOr::DateValue(a), TypeOr::DateValue(b)) => check_same_date(a, b),
                (TypeOr::DateList(a), TypeOr::DateList(b)) => {
                    let a = a.iter().map(|x| x.timestamp()).sum::<i64>();
                    let b = b.iter().map(|x| x.timestamp()).sum::<i64>();
                    a.partial_cmp(&b).unwrap()
                    //check a and b are same with the date using check
                }
                (TypeOr::DateList(a), TypeOr::DateValue(b)) => {
                    let a = a.iter().map(|x| x.timestamp()).sum::<i64>();
                    let b = b.timestamp();
                    a.partial_cmp(&b).unwrap()
                }
                _ => panic!("Error"),
            }
        });

        //const filter functions
        let only_filter_functions = FORMULA_LIST_CELL
            .clone()
            .into_iter()
            .filter(|x| x.isFilter)
            .collect::<Vec<html::formula>>();

        // re arrange the all_html based on the entry id on only_sorting_functions
        let mut new_all_html = vec![];
        if sorting.clone().trim() == "" {
            new_all_html = all_html.clone()
        }
        let mut filtered_list = vec![];
        // Print all the filter formula
        // println!("Filter Formula: {:?}", ORIGINAL_DOC_ID_LIST);
        for formula in only_filter_functions {
            if formula.data == TypeOr::Right(2.0) {
                //  find saperated docs with the entry id
                for entry in ORIGINAL_DOC_ID_LIST.clone() {
                    if entry.entry == formula.entry {
                        filtered_list.extend(entry.ids);
                    }
                }
            }
        }

        // // list all the index based on the EntryID and ORIGINAL DOC ID LIST
        // let mut original_shape = vec![];
        // let doc_list = ORIGINAL_DOC_ID_LIST.clone();
        // let mut a = 0;
        // ENTRY_IDS.iter().for_each(|x| {
        //     for entry in doc_list.clone() {
        //         if entry.ids.clone().front().unwrap().to_string() == x.to_string() {
        //             original_shape.push(a);
        //             a += 1;
        //         }
        //     }
        // });
        // println!("Original Shape: {:?}", original_shape);

        // Clone all_html
        for sort in only_sorting_functions {
            // sort based on the entry id
            // get the index element from all_html
            let index = sort.entry as usize;

            new_all_html.push(all_html.clone()[index].clone());
        }
        if !sorting_up && sorting.clone().trim() != "" {
            //  Revese the list
            new_all_html.reverse();
        }

        let mut parsed_text = "".to_string();
        for text in new_all_html {
            parsed_text += &text.concat();
        }

        Ok(return_data {
            formula_list: FORMULA_LIST_CELL.clone(),
            sorted: "".to_string(),
            filtered: filtered_list,
            parsed_text,
            is_error: false,
            tables: tables,
        })
    }
}

#[derive(Parser)]
#[grammar = "./parser.pest"]
struct MyParser;

fn parse_string(
    formula: html::formula,
    searcher: Searcher,
    schema: Schema,
    formula_list: Vec<html::formula>,
) -> tantivy::Result<TypeOr<String, f64, NaiveDateTime>> {
    // Skip parsing if formula is empty or literally "Error"
    if formula.formula.trim().is_empty() || formula.formula.trim() == "Error" {
        unsafe {
            // Set formula as error
            let mut formula_list = FORMULA_LIST_CELL.clone();
            formula_list.iter_mut().for_each(|x| {
                if x.id == formula.id {
                    x.data = TypeOr::Error;
                }
            });
            FORMULA_LIST_CELL = formula_list;
        }
        return Ok(TypeOr::Error);
    }
    
    let pairs = match MyParser::parse(Rule::Fn, formula.formula.as_str()) {
        Ok(pairs) => pairs,
        Err(err) => {
            println!("Error parsing formula '{}': {:?}", formula.formula, err);
            unsafe {
                // Set formula as error
                let mut formula_list = FORMULA_LIST_CELL.clone();
                formula_list.iter_mut().for_each(|x| {
                    if x.id == formula.id {
                        x.data = TypeOr::Error;
                    }
                });
                FORMULA_LIST_CELL = formula_list;
            }
            return Ok(TypeOr::Error);
        }
    };
    
    let mut ans: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
    unsafe {
        // set current formula to in process
        let mut formula_list = FORMULA_LIST_CELL.clone();
        formula_list.iter_mut().for_each(|x| {
            if x.id == formula.id {
                x.data = TypeOr::InProcess;
            }
        });
        FORMULA_LIST_CELL = formula_list;
    }

    for pair in pairs {
        ans = recursive_funcation_parser(
            pair,
            searcher.clone(),
            schema.clone(),
            formula_list.clone(),
            formula.clone(),
        );
        unsafe {
            let mut formula_list = FORMULA_LIST_CELL.clone();
            formula_list.iter_mut().for_each(|x| {
                if x.id == formula.id {
                    x.data = ans.clone();
                }
            });

            FORMULA_LIST_CELL = formula_list;
        }
    }

    Ok(TypeOr::None)
}

fn parse_string_in_cell(
    formula: html::formula,
    searcher: Searcher,
    schema: Schema,
    formula_list: Vec<html::formula>,
) -> TypeOr<String, f64, NaiveDateTime> {
    let pairs = match MyParser::parse(Rule::Fn, formula.formula.as_str()) {
        Ok(pairs) => pairs,
        Err(err) => {
            println!("Error parsing formula in cell '{}': {:?}", formula.formula, err);
            return TypeOr::Error;
        }
    };
    
    let mut ans: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;

    for pair in pairs {
        ans = recursive_funcation_parser(
            pair,
            searcher.clone(),
            schema.clone(),
            formula_list.clone(),
            formula.clone(),
        );
    }

    ans
}

#[derive(Debug, PartialEq, PartialOrd)]
enum TypeOr<S, T, Y> {
    Left(S),
    Right(T),
    LeftList(Vec<S>),
    RightList(Vec<T>),
    DateValue(Y),
    DateList(Vec<Y>),
    Error,
    None,
    NotCalculated,
    InProcess,
}

impl Serialize for TypeOr<std::string::String, f64, NaiveDateTime> {
    fn serialize<S>(&self, serializer: S) -> std::prelude::v1::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            TypeOr::Left(value) => serializer.serialize_str(value),
            TypeOr::Right(value) => serializer.serialize_f64(*value),
            TypeOr::LeftList(value) => serializer.serialize_str(&value.join("")),
            TypeOr::RightList(value) => serializer.serialize_str(
                &value
                    .iter()
                    .map(|x| x.to_string())
                    .collect::<Vec<String>>()
                    .join(","),
            ),
            TypeOr::DateValue(value) => serializer.serialize_str(&value.to_string()),
            TypeOr::DateList(value) => serializer.serialize_str(
                &value
                    .iter()
                    .map(|x| x.to_string())
                    .collect::<Vec<String>>()
                    .join(","),
            ),
            TypeOr::None => serializer.serialize_str("None"),
            TypeOr::Error => serializer.serialize_str("Error"),
            TypeOr::NotCalculated => serializer.serialize_str("Not Calculated"),
            TypeOr::InProcess => serializer.serialize_str("In Process"),
        }
    }
}

impl Clone for TypeOr<String, f64, NaiveDateTime> {
    fn clone(&self) -> Self {
        match self {
            TypeOr::Left(value) => TypeOr::Left(value.clone()),
            TypeOr::Right(value) => TypeOr::Right(*value),
            TypeOr::LeftList(value) => TypeOr::LeftList(value.clone()),
            TypeOr::RightList(value) => TypeOr::RightList(value.clone()),
            TypeOr::DateValue(value) => TypeOr::DateValue(value.clone()),
            TypeOr::DateList(value) => TypeOr::DateList(value.clone()),
            TypeOr::None => TypeOr::None,
            TypeOr::Error => TypeOr::Error,
            TypeOr::NotCalculated => TypeOr::NotCalculated,
            TypeOr::InProcess => TypeOr::InProcess,
        }
    }
}
impl ToString for TypeOr<String, f64, NaiveDateTime> {
    fn to_string(&self) -> String {
        match self {
            TypeOr::Left(value) => value.clone(),
            TypeOr::Right(value) => value.to_string(),
            TypeOr::LeftList(value) => value.join(""),
            TypeOr::RightList(value) => value.clone().iter().map(|x| x.to_string()).collect(),
            TypeOr::DateValue(value) => value.to_string(),
            TypeOr::DateList(value) => value
                .clone()
                .iter()
                .map(|x| x.to_string())
                .collect::<Vec<String>>()
                .join(""),
            TypeOr::None => "None".to_string(),
            TypeOr::Error => "Error".to_string(),
            TypeOr::NotCalculated => "Not Calculated".to_string(),
            TypeOr::InProcess => "In Process".to_string(),
        }
    }
}

fn column_to_number(col: &str) -> u32 {
    let mut result = 0;
    let base = 26; // Excel columns are in base 26 (A-Z)

    for c in col.chars() {
        // Convert the character to an integer ('A' -> 1, 'B' -> 2, ..., 'Z' -> 26)
        let value = c as u32 - 'A' as u32 + 1;
        result = result * base + value;
    }

    result
}

fn extract_column_and_row(reference: &str) -> (u32, u32) {
    // Find where the first digit appears to separate column and row
    let column_end = reference.chars().position(|c| c.is_digit(10)).unwrap();
    
    // Separate column (letters) and row (digits)
    let column = &reference[0..column_end];
    let row: u32 = reference[column_end..].parse().unwrap();
    
    // Convert the column part into a number
    let column_number = column_to_number(column);

    (column_number, row)
}

fn recursive_funcation_parser<'a>(
    pair: Pair<'a, Rule>,
    searcher: Searcher,
    schema: Schema,
    formula_list: Vec<html::formula>,
    formula: html::formula,
) -> TypeOr<String, f64, NaiveDateTime> {
    match pair.as_rule() {
        Rule::Fn => {
            for inner_pair in pair.into_inner() {
                let ans =
                    recursive_funcation_parser(inner_pair, searcher, schema, formula_list, formula);
                return ans;
            }
            return TypeOr::None;
        }

        Rule::EVAL_TABLE => {
            // Vector to store the extracted patterns
            let mut patterns: Vec<String> = Vec::new();
            
            // Default values for table name, range, and value type
            let mut table_name: Option<String> = None;
            let mut range = "";
            let mut value_type = "";
        
            // Iterate through inner pairs to extract patterns
            for inner_pair in pair.into_inner() {
                for eval_pair in inner_pair.into_inner() {
                    if eval_pair.as_rule() == Rule::FINDING_PATTREN {
                        // Collect the patterns (strings) from the FINDING_PATTREN rule
                        patterns.push(eval_pair.as_str().to_string());
                    }
                }
            }

            let mut table_data: Option<&html::TableData> = None;

            if patterns.len() == 3 {
                table_name = Some(patterns[0].to_string());
                range = patterns[1].as_str();
                value_type = patterns[2].as_str();
            
                unsafe {
                    if let Some(table_id) = TABLE_LIST_CELL
                        .iter()
                        .find(|p| p.name.as_ref().map(|s| s.as_str()) == table_name.as_deref())
                        .map(|table| table.id.clone())
                    {
                        table_data = TABLE_DATA_LIST.iter().find(|p| p.id == table_id);
                    }
                }
            } else if patterns.len() == 2 {
                range = patterns[0].as_str();
                value_type = patterns[1].as_str();
            
                unsafe {
                    if let Some(ref table_id) = formula.table_id {
                        table_data = TABLE_DATA_LIST.iter().find(|p| &p.id == table_id);
                    }
                }
            } else {
                return TypeOr::Error;
            }
            
            let positions: Vec<&str> = range.split(":").collect();

            let mut rows: Vec<u32> = vec![];
            let mut cols: Vec<u32> = vec![];
            
            for position in &positions {
                let (column_number, row_number) = extract_column_and_row(*position);
                rows.push(row_number);
                cols.push(column_number);
            }

            rows.sort();
            cols.sort();

            let mut string_vals: Vec<String> = Vec::new();
            let mut number_vals: Vec<f64> = Vec::new();
            let mut date_vals: Vec<NaiveDateTime> = Vec::new();
        
            unsafe {
                for i in cols[0]..=cols[1] {
                    for j in rows[0]..=rows[1] {
                        // Get the cell from the HashMap inside the Vec
                        unsafe {
                            if let Some(selected_table) = table_data {
                                let data = &selected_table.data;
                                // Now you can work with the `data` HashMap
                                if let Some(cell) = data.get(&(j as usize - 1, i as usize - 1)) {
                                    let mut cell_data = cell.clone();
                                    if let Some(cell_formula) = formula_list.iter().find(|p| p.id == *cell) {
                                        cell_data = parse_string_in_cell(cell_formula.clone(), searcher.clone(), schema.clone(), formula_list.clone()).to_string();
                                    }
                                    match value_type {
                                        "NUMBER" => {
                                            let re = Regex::new(r"[-+]?\d*\.?\d+(e[-+]?\d+)?").unwrap();

                                            if let Some(mat) = re.find(&cell_data) {
                                                if let Ok(num) = mat.as_str().parse::<f64>() {
                                                    number_vals.push(num);
                                                }
                                            }
                                        }
                                        "DATE" => {
                                            if let Ok(date) = parse(&cell_data) {
                                                date_vals.push(date.naive_utc());
                                            }
                                        }
                                        _ => {
                                            string_vals.push(cell_data.clone());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                    
                if !number_vals.is_empty() {
                    TypeOr::RightList(number_vals)
                } else if !date_vals.is_empty() {
                    TypeOr::DateList(date_vals)
                } else if !string_vals.is_empty() {
                    TypeOr::LeftList(string_vals)
                } else {
                    TypeOr::None
                }
            }
        }

        Rule::CHAIN_PATTREN => {
            let mut is_local = false;
            let mut last_data_index = pair
                .clone()
                .into_inner()
                .filter(|x| x.as_rule() == Rule::EVAL_PATTREN)
                .count();

            let mut is_last_eval = false;
            let mut entry_list: Vec<u64> = vec![];
            let mut index = 0;
            let mut final_output: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;

            for inner_pair in pair.into_inner() {
                if inner_pair.as_rule() == Rule::EVAL_PATTREN {
                    index += 1;
                    last_data_index -= 1;
                }
                if last_data_index == 0 {
                    is_last_eval = true;
                }

                for eval_pair in inner_pair.into_inner() {
                    if eval_pair.as_rule() == Rule::IS_LOCAL {
                        if last_data_index != 0 {
                            panic!("IS_LOCAL can only be used at the end of the chain")
                        }
                        is_local = true;
                    } else if (eval_pair.as_rule() == Rule::FINDING_PATTREN) {
                        let mut found_data: Vec<(f32, DocAddress)>;
                        if is_last_eval {
                            if !is_local {
                                found_data = documents::search_data(
                                    eval_pair.as_str(),
                                    searcher.clone(),
                                    schema.clone(),
                                    entry_list.clone(),
                                    index == 1,
                                )
                                .unwrap();
                            } else {
                                found_data = documents::search_data(
                                    eval_pair.as_str(),
                                    searcher.clone(),
                                    schema.clone(),
                                    vec![formula.entry],
                                    false,
                                )
                                .unwrap()
                            }
                        } else {
                            found_data = documents::search_data(
                                eval_pair.as_str(),
                                searcher.clone(),
                                schema.clone(),
                                entry_list.to_vec(),
                                index == 1,
                            )
                            .unwrap();
                        }
                        let mut is_str = false;
                        let mut is_num = false;
                        let mut is_date = false;
                        let mut final_formula = eval_pair.as_str();

                        let mut return_val: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
                        let mut exp: Regex;
                        if final_formula.find("{TEXT}") != None {
                            is_str = true;
                            exp = Regex::new(
                                final_formula
                                    .replace("{TEXT}", r"(?<text>[^ \n]+)")
                                    .as_str(),
                            )
                            .unwrap();
                            return_val = TypeOr::LeftList([].to_vec());
                        } else if final_formula.find("{NUMBER}") != None {
                            is_num = true;
                            exp = Regex::new(
                                final_formula
                                    .replace("{NUMBER}", r"(?<number>[+-]?([0-9]*[.])?[0-9]+)")
                                    .as_str(),
                            )
                            .unwrap();
                            return_val = TypeOr::RightList([].to_vec());
                        } else if final_formula.find("{DATE}") != None {
                            is_date = true;
                            // price data 11/01/2020
                            exp = Regex::new(
                                final_formula
                                    .replace("{DATE}", r"(?<date>([^ \n]+))")
                                    .as_str(),
                            )
                            .unwrap();
                            return_val = TypeOr::DateList([].to_vec());
                        } else {
                            exp = Regex::new(final_formula).unwrap();
                        }
                        let uuid_regexp = r"(?<uuid>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})";
                        let uuid_regexp_formula = final_formula
                            .replace("{NUMBER}", uuid_regexp)
                            .replace("{TEXT}", uuid_regexp)
                            .replace("{DATE}", uuid_regexp);
                        let uuid_regexp = Regex::new(&uuid_regexp_formula).unwrap();
                        let mut number_list: Vec<f64> = vec![];
                        let mut string_list: Vec<String> = vec![];
                        let mut date_list: Vec<NaiveDateTime> = vec![];
                        ////////
                        for (_, data) in found_data.into_iter() {
                            let retrieved_doc = searcher.doc(data).clone().unwrap();

                            if (!is_last_eval) {
                                // get only entry id list we dont need any other listing thing
                                for field in retrieved_doc
                                    .get_all(schema.get_field("entry").unwrap())
                                    .into_iter()
                                {
                                    let selected_field = field.as_u64().unwrap();
                                    entry_list.push(selected_field);
                                }
                            } else {
                                for field in retrieved_doc
                                    .get_all(schema.get_field("body").unwrap())
                                    .into_iter()
                                {
                                    // LOOP THROUGH ALL THE RETRIEVED DOCS
                                    let mut finding_string = field.as_text().unwrap();
                                    let mut non_unwrapped_result_uuid =
                                        uuid_regexp.captures(finding_string);

                                    let has_value = non_unwrapped_result_uuid;
                                    let mut found_uuid = true;
                                    let mut found_uuid_value = "".to_string();
                                    let has_value = match uuid_regexp.captures(finding_string) {
                                        Some(caps) => {
                                            found_uuid = true;
                                            found_uuid_value = caps[1].to_string();
                                            // non_unwrapped_result_uuid.unwrap()
                                        }
                                        None => {
                                            found_uuid = false;
                                            // Handle the case when uuid_regexp.captures(finding_string) returns None
                                            // You can add your own logic here
                                        }
                                    };

                                    // Let line number for the retrieved data

                                    if found_uuid {
                                        let result = found_uuid_value;
                                        //TREE TRAVERSAL FOR FORMULA
                                        let current_formula_search: Option<&html::formula>;

                                        unsafe {
                                            current_formula_search =
                                                FORMULA_LIST_CELL.iter().find(|x| result == x.id)
                                        }
                                        let formula = current_formula_search.unwrap();

                                        if !current_formula_search.is_none()
                                            && formula.data != TypeOr::InProcess
                                        {
                                            if formula.data == TypeOr::NotCalculated {
                                                // set current formula to in process

                                                let val = parse_string(
                                                    current_formula_search.unwrap().clone(),
                                                    searcher.clone(),
                                                    schema.clone(),
                                                    [].to_vec(),
                                                )
                                                .unwrap();

                                                let mut new_list: Vec<html::formula>;
                                                unsafe {
                                                    new_list = FORMULA_LIST_CELL.clone();
                                                }

                                                new_list.iter_mut().for_each(|x| {
                                                    if x.id == formula.id {
                                                        x.data = val.clone();
                                                    }
                                                });

                                                unsafe {
                                                    FORMULA_LIST_CELL = new_list;
                                                }
                                            }
                                            unsafe {
                                                let val = FORMULA_LIST_CELL
                                                    .iter()
                                                    .find(|x| x.id == result)
                                                    .unwrap()
                                                    .data
                                                    .clone();

                                                if is_str {
                                                    string_list.push(val.to_string());
                                                } else if is_num {
                                                    catch! {
                                                        try{

                                                        let num = val.to_string().parse::<f64>()?;

                                                        number_list.push(num);
                                                        }catch err {

                                                        }

                                                    }
                                                } else if is_date {
                                                    catch! {
                                                     try{
                                                         date_list.push(
                                                           get_date( parse(val.to_string().as_str())?.naive_utc()),
                                                        );
                                                    }catch err {
                                                    }
                                                    }
                                                }
                                            }
                                            continue; // we don't need to go further
                                        }
                                    }

                                    let mut non_unwrapped_result = exp.captures(finding_string);
                                    if (non_unwrapped_result.is_none()) {
                                        continue;
                                    }
                                    let result = non_unwrapped_result.unwrap();
                                    if is_str {
                                        string_list.push(result["text"].to_string());
                                    } else if is_num {
                                        number_list.push(result["number"].parse::<f64>().unwrap());
                                    } else if is_date {
                                        // println!("Eval Pair {:}", eval_pair.as_str());
                                        // println!("Date: {:?}", result["date"].to_string());

                                        catch! {

                                         try{
                                            date_list.push(
                                               get_date( parse(&result["date"].to_string()).unwrap().naive_utc()),
                                            );
                                        }catch err {
                                        }
                                        }
                                    }
                                }

                                // return return_val;
                            }
                        }
                        // make entry list uniq elements

                        if !is_last_eval {
                            continue;
                        }

                        if is_str {
                            let str_list = string_list
                                .iter()
                                .map(|x| x.as_str())
                                .collect::<Vec<&str>>();
                            return_val = TypeOr::LeftList(string_list);
                        } else if is_num {
                            return_val = TypeOr::RightList(number_list);
                        } else if is_date {
                            return_val = TypeOr::DateList(date_list);
                        }
                        return return_val;
                    }
                }

                // EVAL only has 2 pairs IsLocal and Finding Pattern
            }
            return final_output;
        }

        Rule::EVAL => {
            for inner_pair in pair.into_inner() {
                return recursive_funcation_parser(
                    inner_pair,
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );
            }
            return TypeOr::None;
            // Check if inner pair containes IS_LOCAL
        }
        Rule::SUM => {
            let mut final_sum = 0.0;
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair,
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );
                match ans {
                    TypeOr::Right(value) => final_sum += value,
                    TypeOr::RightList(value) => {
                        for i in value {
                            final_sum += i;
                        }
                    }
                    any => return TypeOr::None,
                }
            }
            return TypeOr::Right(final_sum);
        }
        Rule::COUNT => {
            let mut val: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair.clone(),
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );

                match ans {
                    TypeOr::Right(value) => val = TypeOr::Right(1.0),
                    TypeOr::RightList(value) => val = TypeOr::Right(value.len() as f64),
                    TypeOr::LeftList(value) => val = TypeOr::Right(value.len() as f64),
                    TypeOr::Left(value) => val = TypeOr::Right(1.0),
                    TypeOr::DateList(value) => val = TypeOr::Right(value.len() as f64),
                    TypeOr::DateValue(value) => val = TypeOr::Right(1.0),
                    any => return TypeOr::None,
                };
            }
            return val;
        }
        Rule::LEN => {
            let mut val: f64 = 0.0;
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair.clone(),
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );
                if inner_pair.as_rule() == Rule::text {
                    // val -= 2.0;
                }

                match ans {
                    TypeOr::LeftList(value) => {
                        val += value.into_iter().fold(0, |x, y| x + y.len()) as f64
                    }
                    TypeOr::Left(value) => val += value.len() as f64,
                    any => return TypeOr::None,
                };
            }
            return TypeOr::Right(val);
        }

        Rule::CONCAT => {
            let mut val: String = "".to_string();
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair.clone(),
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );
                match ans {
                    TypeOr::Right(value) => val += &value.to_string(),
                    TypeOr::RightList(value) => {
                        val += &value
                            .iter()
                            .map(|x| x.to_string())
                            .collect::<Vec<String>>()
                            .join("")
                    }
                    TypeOr::LeftList(value) => {
                        val += &value
                            .iter()
                            .map(|x| x.to_string())
                            .collect::<Vec<String>>()
                            .join("")
                    }
                    TypeOr::Left(value) => val += &value,
                    TypeOr::DateList(value) => {
                        val += &value
                            .iter()
                            .map(|x| x.to_string())
                            .collect::<Vec<String>>()
                            .join("")
                    }
                    TypeOr::DateValue(value) => val += &value.to_string(),
                    any => val += &any.to_string(),
                };
            }
            return TypeOr::Left(val);
        }
        Rule::TRIM => {
            let mut val: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair.clone(),
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );

                match ans {
                    TypeOr::LeftList(value) => {
                        val = TypeOr::LeftList(
                            value
                                .iter()
                                .map(|x| x.to_string().trim().to_string())
                                .collect::<Vec<String>>(),
                        )
                    }
                    TypeOr::Left(value) => val = TypeOr::Left(value.trim().to_string()),
                    any => val = any,
                };
            }
            return val;
        }

        Rule::MIN => {
            let mut val: f64 = f64::MAX;

            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair.clone(),
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );
                match ans {
                    TypeOr::Right(value) => {
                        if value < val {
                            val = value
                        }
                    }
                    TypeOr::RightList(value) => {
                        let found_val = value
                            .iter()
                            .map(|x| *x as f64)
                            .min_by(|a, b| a.partial_cmp(b).unwrap())
                            .unwrap()
                            .clone();

                        if found_val < val {
                            val = found_val;
                        }
                    }
                    any => return TypeOr::None,
                };
            }
            return TypeOr::Right(val);
        }
        Rule::MAX => {
            let mut val: f64 = f64::MIN;
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair.clone(),
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );
                match ans {
                    TypeOr::Right(value) => {
                        if value > val {
                            val = value
                        }
                    }
                    TypeOr::RightList(value) => {
                        let found_val = value
                            .iter()
                            .map(|x| *x as f64)
                            .max_by(|a, b| a.partial_cmp(b).unwrap())
                            .unwrap()
                            .clone();

                        if found_val > val {
                            val = found_val;
                        }
                    }
                    any => return TypeOr::None,
                };
            }
            return TypeOr::Right(val);
        }
        Rule::ROUND => {
            let mut val: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
            let mut decimal_places = 0;
            let mut first_param = true;
            
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair.clone(),
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );

                if first_param {
                    first_param = false;
                    match ans {
                        TypeOr::Right(value) => val = TypeOr::Right(value),
                        TypeOr::RightList(value) => val = TypeOr::RightList(value),
                        any => return TypeOr::None,
                    };
                } else {
                    // Second parameter - decimal places
                    if let TypeOr::Right(places) = ans {
                        decimal_places = places as i32;
                    }
                }
            }
            
            // Apply rounding with the specified decimal places
            match val {
                TypeOr::Right(value) => val = TypeOr::Right(round(value as f64, decimal_places) as f64),
                TypeOr::RightList(value) => {
                    val = TypeOr::RightList(
                        value.iter().map(|x| round(*x as f64, decimal_places) as f64).collect(),
                    )
                }
                _ => {}
            }
            
            return val;
        }
        Rule::AVERAGE => {
            let mut total: f64 = 0.0;
            let mut count: f64 = 0.0;
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair.clone(),
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );

                match ans {
                    TypeOr::Right(value) => {
                        total += (value);
                        count += 1.0
                    }
                    TypeOr::RightList(value) => {
                        total += value.iter().sum::<f64>();
                        count += value.len() as f64;
                    }
                    any => return TypeOr::None,
                };
            }
            return TypeOr::Right(total / count);
        }
        Rule::MUL => {
            let mut final_sum = 1.0;
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair,
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );
                match ans {
                    TypeOr::Right(value) => final_sum *= value,
                    TypeOr::RightList(value) => {
                        for i in value {
                            final_sum *= i;
                        }
                    }
                    any => return TypeOr::None,
                }
            }
            return TypeOr::Right(final_sum);
        }
        Rule::DIV => {
            let mut final_sum = 1.0;
            let mut is_first = true;
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair,
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );
                match ans {
                    TypeOr::Right(value) => {
                        if is_first {
                            final_sum = value;
                            is_first = false;
                        } else {
                            final_sum /= value;
                        }
                    }
                    TypeOr::RightList(value) => {
                        for i in value {
                            if is_first {
                                final_sum = i;
                                is_first = false;
                            } else {
                                final_sum /= i;
                            }
                        }
                    }
                    any => return TypeOr::None,
                }
            }
            return TypeOr::Right(final_sum);
        }

        Rule::number => return TypeOr::Right(pair.as_str().parse::<f64>().unwrap()),
        Rule::text => {
            for inner_pair in pair.into_inner() {
                if inner_pair.as_rule() == Rule::text_val {
                    return TypeOr::Left(inner_pair.as_str().to_string());
                }
            }
            return TypeOr::Left("".to_string());
        }
        Rule::DATE => {
            //length of inner pair
            let len = pair.clone().into_inner().count();
            let mut date_list = TypeOr::DateList([].to_vec());
            let mut date_vec: Vec<NaiveDateTime> = [].to_vec();
            if (len == 1) {
                for inner_pair in pair.clone().into_inner() {
                    if inner_pair.as_rule() == Rule::text {
                        for inner_pair in inner_pair.into_inner() {
                            if inner_pair.as_rule() == Rule::text_val {
                                return TypeOr::DateValue(get_date(
                                    parse(inner_pair.as_str()).unwrap().naive_utc(),
                                ));
                            }
                        }
                    }
                }
            } else {
                for inner_pair in pair.into_inner() {
                    if inner_pair.as_rule() == Rule::text {
                        for inner_pair in inner_pair.into_inner() {
                            if inner_pair.as_rule() == Rule::text_val {
                                date_vec.push(get_date(
                                    parse(inner_pair.as_str()).unwrap().naive_utc(),
                                ));
                            }
                        }
                    }
                }
                return TypeOr::DateList(date_vec);
            }
            return date_list;
        }
        Rule::NUMBER => {
            let len = pair.clone().into_inner().count();
            let mut num_vec: Vec<f64> = [].to_vec();
            if (len == 1) {
                for inner_pair in pair.clone().into_inner() {
                    if inner_pair.as_rule() == Rule::text {
                        for inner_pair in inner_pair.into_inner() {
                            if inner_pair.as_rule() == Rule::text_val {
                                return TypeOr::Right(inner_pair.as_str().parse::<f64>().unwrap());
                            }
                        }
                    }
                }
            } else {
                for inner_pair in pair.into_inner() {
                    if inner_pair.as_rule() == Rule::text {
                        for inner_pair in inner_pair.into_inner() {
                            if inner_pair.as_rule() == Rule::text_val {
                                num_vec.push(inner_pair.as_str().parse::<f64>().unwrap());
                            }
                        }
                    }
                }
            }
            return TypeOr::RightList(num_vec);
        }
        Rule::TEXT => {
            let len = pair.clone().into_inner().count();
            let mut text_vec: Vec<String> = [].to_vec();
            if (len == 1) {
                for inner_pair in pair.clone().into_inner() {
                    if inner_pair.as_rule() == Rule::text {
                        for inner_pair in inner_pair.into_inner() {
                            if inner_pair.as_rule() == Rule::text_val {
                                return TypeOr::Left(inner_pair.as_str().to_string());
                            }
                        }
                    }
                }
            } else {
                for inner_pair in pair.into_inner() {
                    if inner_pair.as_rule() == Rule::text {
                        for inner_pair in inner_pair.into_inner() {
                            if inner_pair.as_rule() == Rule::text_val {
                                text_vec.push(inner_pair.as_str().to_string());
                            }
                        }
                    }
                }
            }
            return TypeOr::LeftList(text_vec);
        }

        Rule::TYPE => {
            let mut val: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair.clone(),
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );

                match ans {
                    TypeOr::Right(value) => val = TypeOr::Left("NUMBER".to_string()),
                    TypeOr::RightList(value) => val = TypeOr::Left("NUMBER".to_string()),
                    TypeOr::LeftList(value) => val = TypeOr::Left("TEXT".to_string()),
                    TypeOr::Left(value) => val = TypeOr::Left("TEXT".to_string()),
                    TypeOr::None => val = TypeOr::None,
                    TypeOr::DateValue(value) => val = TypeOr::Left("DATE".to_string()),
                    TypeOr::DateList(value) => val = TypeOr::Left("DATE".to_string()),
                    TypeOr::Error => val = TypeOr::Left("ERROR".to_string()),
                    TypeOr::NotCalculated => val = TypeOr::Left("NOT CALCULATED".to_string()),
                    TypeOr::InProcess => val = TypeOr::Left("IN PROCESS".to_string()),
                };
            }
            return val;
        }
        Rule::IFERROR => {
            let mut has_first_calculated = false;
            let mut has_error = false;
            for inner_pair in pair.into_inner() {
                if (!has_first_calculated) {
                    let ans = recursive_funcation_parser(
                        inner_pair.clone(),
                        searcher.clone(),
                        schema.clone(),
                        formula_list.clone(),
                        formula.clone(),
                    );
                    if ans == TypeOr::None {
                        has_error = true;
                    }
                    has_first_calculated = true;
                    continue;
                } else {
                    if (has_error) {
                        return recursive_funcation_parser(
                            inner_pair.clone(),
                            searcher.clone(),
                            schema.clone(),
                            formula_list.clone(),
                            formula.clone(),
                        );
                    }
                    has_error = true;
                    continue;
                }
            }
            return TypeOr::None;
        }

        Rule::IF => {
            let mut final_ans = false;
            for inner_pair in pair.into_inner() {
                let mut isEQ = false;
                let mut isNEQ = false;
                let mut isGT = false;
                let mut isLT = false;
                let mut isGTE = false;
                let mut isLTE = false;

                if inner_pair.as_rule() == Rule::COMPARATOR {
                    let mut is_left = true;
                    let mut left_answer: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
                    let mut right_answer: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;

                    for compare_pair in inner_pair.clone().into_inner() {
                        let mut ans = recursive_funcation_parser(
                            compare_pair.clone(),
                            searcher.clone(),
                            schema.clone(),
                            formula_list.clone(),
                            formula.clone(),
                        );
                        match ans.clone() {
                            TypeOr::DateValue(val) => {
                                ans = TypeOr::Right(val.and_utc().timestamp() as f64);
                            }
                            _ => {}
                        }

                        if (is_left) {
                            left_answer = ans;
                            is_left = false;
                        } else {
                            right_answer = ans;
                        }
                        if compare_pair.as_rule() == Rule::COMPARATOR_SIGN {
                            let sign = compare_pair.as_str();
                            if sign == "==" || sign == "=" {
                                isEQ = true;
                            } else if sign == "!=" {
                                isNEQ = true;
                            } else if sign == ">" {
                                isGT = true;
                            } else if sign == "<" {
                                isLT = true;
                            } else if sign == ">=" {
                                isGTE = true;
                            } else if sign == "<=" {
                                isLTE = true;
                            }
                        }
                    }

                    if let (TypeOr::RightList(mut list)) = left_answer.clone() {
                        if list.len() == 1 {
                            left_answer = TypeOr::Right(list[0]);
                        }
                    }
                    if let (TypeOr::DateList(mut list)) = left_answer.clone() {
                        if list.len() == 1 {
                            left_answer = TypeOr::Right(list[0].timestamp() as f64);
                        } else {
                            left_answer =
                                TypeOr::Right(list.into_iter().map(|x| x.timestamp() as f64).sum());
                        }
                    }
                    if let (TypeOr::LeftList(mut list), TypeOr::Left(mut list2)) =
                        (left_answer.clone(), right_answer.clone())
                    {
                        if list.len() == 1 {
                            left_answer = TypeOr::Left(list[0].to_string());
                        }
                    }

                    //  println!("Left Answer: {:?}", left_answer);
                    //  println!("Right Answer: {:?}", right_answer);

                    if isEQ {
                        final_ans = left_answer == right_answer;
                    } else if isNEQ {
                        final_ans = left_answer != right_answer;
                    } else if isGT {
                        // all of the left ans values are greater than right ans
                        if let (TypeOr::RightList(left_list), TypeOr::RightList(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            final_ans = left_list
                                .iter()
                                .enumerate()
                                .all(|(i, x)| x > &right_list[i]);
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            final_ans = left_list > right_list;
                        } else {
                            final_ans = false;
                        }
                    } else if isLT {
                        if let (TypeOr::RightList(left_list), TypeOr::RightList(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            final_ans = left_list
                                .iter()
                                .enumerate()
                                .all(|(i, x)| x < &right_list[i]);
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            final_ans = left_list < right_list;
                        } else {
                            final_ans = false;
                        }
                    } else if isGTE {
                        if let (TypeOr::RightList(left_list), TypeOr::RightList(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            final_ans = left_list
                                .iter()
                                .enumerate()
                                .all(|(i, x)| x >= &right_list[i]);
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            final_ans = left_list >= right_list;
                        } else {
                            final_ans = false;
                        }
                    } else if isLTE {
                        if let (TypeOr::RightList(left_list), TypeOr::RightList(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            final_ans = left_list
                                .iter()
                                .enumerate()
                                .all(|(i, x)| x <= &right_list[i]);
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            final_ans = left_list <= right_list;
                        } else {
                            final_ans = false;
                        }
                    }
                }

                if final_ans && inner_pair.as_rule() == Rule::Fn {
                    return recursive_funcation_parser(
                        inner_pair.clone(),
                        searcher.clone(),
                        schema.clone(),
                        formula_list.clone(),
                        formula.clone(),
                    );
                }
                if inner_pair.as_rule() == Rule::Fn {
                    final_ans = true;
                }
            }
            return TypeOr::None;
        }

        Rule::SUMIF => {
            let mut final_ans = false;
            let mut sum = 0.0;
            for inner_pair in pair.into_inner() {
                if inner_pair.as_rule() == Rule::COMPARATOR_COUNT {
                    let mut is_left = true;
                    let mut left_answer: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
                    let mut right_answer: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
                    let mut isEQ = false;
                    let mut isNEQ = false;
                    let mut isGT = false;
                    let mut isLT = false;
                    let mut isGTE = false;
                    let mut isLTE = false;
                    for compare_pair in inner_pair.clone().into_inner() {
                        let mut ans = recursive_funcation_parser(
                            compare_pair.clone(),
                            searcher.clone(),
                            schema.clone(),
                            formula_list.clone(),
                            formula.clone(),
                        );
                        match ans.clone() {
                            TypeOr::DateValue(val) => {
                                ans = TypeOr::Right(val.and_utc().timestamp() as f64);
                            }
                            _ => {}
                        }
                        if (is_left) {
                            left_answer = ans;
                            is_left = false;
                        } else {
                            right_answer = ans;
                        }
                        if compare_pair.as_rule() == Rule::COMPARATOR_SIGN {
                            let sign = compare_pair.as_str();
                            if sign == "==" || sign == "=" {
                                isEQ = true;
                            } else if sign == "!=" {
                                isNEQ = true;
                            } else if sign == ">" {
                                isGT = true;
                            } else if sign == "<" {
                                isLT = true;
                            } else if sign == ">=" {
                                isGTE = true;
                            } else if sign == "<=" {
                                isLTE = true;
                            }
                        }
                    }

                    if let (TypeOr::DateList(left_list), TypeOr::DateList(right_list)) =
                        (left_answer.clone(), right_answer.clone())
                    {}

                    if isEQ {
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 == &right_list {
                                    sum += i.1;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list == right_list {
                                sum += left_list;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    } else if isNEQ {
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 != &right_list {
                                    sum += i.1;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list != right_list {
                                sum += left_list;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    } else if isGT {
                        // all of the left ans values are greater than right ans
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 > &right_list {
                                    sum += i.1;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list > right_list {
                                sum += left_list;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    } else if isLT {
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 < &right_list {
                                    sum += i.1;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list < right_list {
                                sum += left_list;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    } else if isGTE {
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 >= &right_list {
                                    sum += i.1;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list >= right_list {
                                sum += left_list;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    } else if isLTE {
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 <= &right_list {
                                    sum += i.1;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list <= right_list {
                                sum += left_list;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    }
                }
            }
            return TypeOr::Right(sum);
        }

        Rule::COUNTIF => {
            let mut final_ans = false;
            let mut total = 0.0;
            for inner_pair in pair.into_inner() {
                if inner_pair.as_rule() == Rule::COMPARATOR_COUNT {
                    let mut is_left = true;
                    let mut left_answer: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
                    let mut right_answer: TypeOr<String, f64, NaiveDateTime> = TypeOr::None;
                    let mut isEQ = false;
                    let mut isNEQ = false;
                    let mut isGT = false;
                    let mut isLT = false;
                    let mut isGTE = false;
                    let mut isLTE = false;
                    for compare_pair in inner_pair.clone().into_inner() {
                        let mut ans = recursive_funcation_parser(
                            compare_pair.clone(),
                            searcher.clone(),
                            schema.clone(),
                            formula_list.clone(),
                            formula.clone(),
                        );
                        match ans.clone() {
                            TypeOr::DateValue(val) => {
                                ans = TypeOr::Right(val.and_utc().timestamp() as f64);
                            }
                            _ => {}
                        }
                        if (is_left) {
                            left_answer = ans;
                            is_left = false;
                        } else {
                            right_answer = ans;
                        }
                        if compare_pair.as_rule() == Rule::COMPARATOR_SIGN {
                            let sign = compare_pair.as_str();
                            if sign == "==" || sign == "=" {
                                isEQ = true;
                            } else if sign == "!=" {
                                isNEQ = true;
                            } else if sign == ">" {
                                isGT = true;
                            } else if sign == "<" {
                                isLT = true;
                            } else if sign == ">=" {
                                isGTE = true;
                            } else if sign == "<=" {
                                isLTE = true;
                            }
                        }
                    }

                    if isEQ {
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 == &right_list {
                                    total += 1.0;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list == right_list {
                                total += 1.0;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    } else if isNEQ {
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 != &right_list {
                                    total += 1.0;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list != right_list {
                                total += 1.0;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    } else if isGT {
                        // all of the left ans values are greater than right ans
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 > &right_list {
                                    total += 1.0;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list > right_list {
                                total += left_list;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    } else if isLT {
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 < &right_list {
                                    total += 1.0;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list < right_list {
                                total += left_list;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    } else if isGTE {
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 >= &right_list {
                                    total += 1.0;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list >= right_list {
                                total += left_list;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    } else if isLTE {
                        if let (TypeOr::RightList(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            for i in left_list.iter().enumerate() {
                                if i.1 <= &right_list {
                                    total += 1.0;
                                }
                            }
                        } else if let (TypeOr::Right(left_list), TypeOr::Right(right_list)) =
                            (left_answer.clone(), right_answer.clone())
                        {
                            if left_list <= right_list {
                                total += left_list;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    }
                }
            }
            return TypeOr::Right(total);
        }

        Rule::COMPARATOR_SIGN => {
            // NO NEED TO IMPLIMENT IT HERE
            return TypeOr::None;
        }
        rule => {
            println!("Unreachable Rule {:?}", rule);
            println!("Unreachable Rule {:?}", pair.as_str());
            return TypeOr::None;
        }
    }
}

fn replace_list_from_string(list: Vec<String>, string: &str) -> String {
    let mut new_string = string.to_string();
    for (_, item) in list.iter().enumerate() {
        new_string = new_string.replace(item, "");
    }
    new_string
}

fn search_doc_address(
    query: &str,
    searcher: Searcher,
    body: Field,
    is_local: bool,
    local_entry_num: i32,
    entry_list: Vec<i32>,
) {
    let term_queries: Vec<Term> = query
        .to_string()
        .split_whitespace()
        .into_iter()
        .map(|term| Term::from_field_text(body, term))
        .collect();

    let phrase_query = PhrasePrefixQuery::new(term_queries);

    let (top_docs, _) = searcher
        .search(&phrase_query, &(TopDocs::with_limit(10000), Count))
        .unwrap();
}

/// SEARCH DATA FROM SPECIFIC CHUNKS AND UPDATE DATA FOR THAT ENTRY
fn search_data(
    query: &str,
    searcher: Searcher,
    body: Field,
    is_local: bool,
) -> Result<TypeOr<&str, f64, NaiveDateTime>> {
    let sanatized_query = replace_list_from_string(
        vec![
            "{TEXT}".to_string(),
            "{NUMBER}".to_string(),
            "{DATE}".to_string(),
        ],
        query,
    );

    let query_whitespace_split: Vec<&str> = sanatized_query.split_whitespace().collect();

    let term_queries: Vec<Term> = query_whitespace_split
        .iter()
        .map(|term| Term::from_field_text(body, term))
        .collect();

    let phrase_query = PhrasePrefixQuery::new(term_queries);

    let (top_docs, _) = searcher
        .search(&phrase_query, &(TopDocs::with_limit(10000), Count))
        .unwrap();

    let make_regexp = Regex::new(
        query
            .replace("{NUMBER}", r"(?<number>[+-]?([0-9]*[.])?[0-9])")
            .as_str(),
    );
    let mut found_numbers_list: Vec<f64> = Vec::new();
    for (_, doc_address) in top_docs {
        let retrieved_doc = searcher.doc(doc_address).unwrap();
        for field in retrieved_doc.get_all(body).into_iter() {
            let selectedField = field.as_text().unwrap();
            let result = make_regexp
                .as_ref()
                .unwrap()
                .captures(selectedField)
                .unwrap();
            let number = result["number"].parse::<f64>().unwrap();
            found_numbers_list.push(number);
        }
    }
    Ok(TypeOr::RightList(found_numbers_list))
}
//

fn check_same_date(dt1: NaiveDateTime, dt2: NaiveDateTime) -> Ordering {
    // check for date month and year
    let dt1 = NaiveDateTime::new(dt1.date(), NaiveTime::from_hms(0, 0, 0));
    let dt2 = NaiveDateTime::new(dt2.date(), NaiveTime::from_hms(0, 0, 0));
    // return ordering
    dt1.partial_cmp(&dt2).unwrap()
}

fn get_date(dateTime: NaiveDateTime) -> NaiveDateTime {
    NaiveDateTime::new(dateTime.date(), NaiveTime::from_hms(0, 0, 0))
}
