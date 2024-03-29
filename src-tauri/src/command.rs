use crate::api::{make_get_request, make_post_request};
use crate::models::{
    APIResult, Commit, Gist, GistInput, GithubUser, NewGistResponse, Repository, URL,
};

extern crate msgbox;

use msgbox::IconType;
use serde::Serialize;

#[tauri::command]
pub fn get_repositories_for_authenticated_user(token: &str) -> APIResult<Vec<Repository>> {
    let response = make_get_request(URL::WithBaseUrl("user/repos?type=private"), Some(token))?;
    let response: Vec<Repository> = serde_json::from_str(&response).unwrap();
    Ok(response)
}

use std::borrow::{Borrow, BorrowMut};
use std::marker::PhantomData;
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
use std::time::Instant;

use chrono::{DateTime, NaiveDateTime};
use dateparser::parse;
use html::formula;
use once_cell::sync::OnceCell;
use pest::iterators::Pair;
use pest::Parser;
use regex::Regex;
use round::round;
use std::path::Path;
use std::{clone, fs, result, string, vec};
use tantivy::collector::{Count, TopDocs};
use tantivy::directory::{MmapDirectory, RamDirectory};
use tantivy::query::{Exclude, Intersection, PhrasePrefixQuery, PhraseQuery};
use tantivy::{doc, Directory, DocAddress, Index, ReloadPolicy, Result};
use tantivy::{schema::*, Searcher};
use try_catch::catch;

mod documents;
mod html;
mod utils;

static mut FORMULA_LIST_CELL: Vec<html::formula> = vec![];

//
const LENGTH: i32 = 1;

// const SINGLE_LINE_EXAMPLE: &str = r#"<p>hello test some 15.5</p><p>hello test some 16.2</p><p>eval some **<formula id="6f8b240b-196a-410d-893f-b5cbe1b769ff">MIN(EVAL("test some {NUMBER}"),177)</formula></p><hr><p>dasd</p><p>my name</p><p>my pc</p><p><formula id="fddde677-e326-4dcd-8333-f81fced7cce5">SUM(EVAL("eval some {NUMBER}"),1)</formula><formula id="fddde677-e326-4dcd-8533-981fced7cce5">TRIM(EVAL("my {TEXT}"))</formula></p><p>
// <formula id="fddde677-e326-4dcd-8333-981fced7cce5">TRIM("one   ")</formula>
// </p><p>
// <formula id="f5dde677-e326-4dcd-8333-981fced7cce5">AVERAGE(EVAL("test some {NUMBER}"),177)</formula>
// </p>"#;
// const SINGLE_LINE_EXAMPLE: &str = r#"<p>hello test some 15</p><p>hello test some 16</p><hr><p><formula id="fddde677-e326-4dcd-8333-f81fced7cce2">SUM(EVAL("hello test some {NUMBER}"),1,EVAL("hello test some {NUMBER}"))</formula></p><p>dasd</p><p>dasdas</p><p><formula id="fddde677-e326-4dcd-8343-f81fced7cce5">SUM(EVAL("eval some {NUMBER}"),0)</formula></p><p>eval some <formula id="6f89240b-196a-410d-893f-b5cbe1b769fg">SUM(10,20)</formula></p>"#;

// SUM(EVAL(!"dog price {NUMBER}"))
// const SINGLE_LINE_EXAMPLE: &str = r#"<p>hello test some 15</p><p>hello test some 16</p><p><formula id="f6d6ee64-2c7f-47df-a91e-641017824f3d">IFERROR(SUM(EVAL("hello test some {NUMBER}"))){SUM(1,2)}ELSE{SUM(1)}</formula><hr>"#;
#[tauri::command]
pub fn run_command(input: String) -> Vec<html::formula> {
    let SINGLE_LINE_EXAMPLE: &str = input.as_str();
    println!("Input: {:?}", SINGLE_LINE_EXAMPLE);

    const simple_string: &str = r#"EVAL("new rust"."some text name")"#; //
    let start_time = Instant::now();

    const simple_string_veh_parameter: &str = r#"SUM(1)"#;
    let parsed_data: html::parse_html_return =
        html::parse_html(SINGLE_LINE_EXAMPLE.repeat(LENGTH as usize).as_str());

    let SEPARATED_DOCS = parsed_data.parsed_text;
    let formula_list = parsed_data.formula_list;
    println!("Formula List: {:?}", formula_list.len());
    //SET GLOBAL LIST FOR FORMULA
    unsafe {
        FORMULA_LIST_CELL = formula_list.clone();
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
    let is_dir = Path::new("data").exists();
    if is_dir {
        fs::remove_dir_all("data").unwrap()
    }
    fs::create_dir_all("data").unwrap();

    // Ram storage
    let ram_dir = RamDirectory::create();
    let global_index = documents::get_schema(ram_dir.clone()).unwrap();

    // START INDEXING
    let start_time = Instant::now();
    // let separated_docs = documents::break_html(EXAMPLE.repeat(LENGTH as usize).as_str());
    let _ = documents::add_inital_docs(ram_dir.to_owned(), SEPARATED_DOCS);

    ram_dir
        .persist(&MmapDirectory::open(Path::new("data")).unwrap())
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
        return FORMULA_LIST_CELL.clone();
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
) -> Result<TypeOr<String, f64, NaiveDateTime>> {
    let pairs = MyParser::parse(Rule::Fn, formula.formula.as_str()).unwrap();
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
        // println!("Final: {:?}", ans);
        // println!("Formula List: {:?}", formula);
    }

    Ok(TypeOr::None)
}

#[derive(Debug, PartialEq)]
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
                                    index == 1,
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
                                    .replace("{TEXT}", r"(?<text>[aA-zA]+)")
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

                            exp = Regex::new(final_formula.replace("{DATE}", r"(?<date>\^(0?[1-9]|1[0-2])[\/](0?[1-9]|[12]\d|3[01])[\/](19|20)\d{2}$)").as_str()).unwrap();
                            return_val = TypeOr::LeftList([].to_vec());
                        } else {
                            exp = Regex::new(final_formula).unwrap();
                        }
                        let uuid_regexp = r"(?<uuid>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})";
                        let uuid_regexp_formula = final_formula
                            .replace("{NUMBER}", uuid_regexp)
                            .replace("{TEXT}", uuid_regexp)
                            .replace("{DATE}", uuid_regexp);
                        let uuid_regexp = Regex::new(&uuid_regexp_formula).unwrap();
                        println!("Final Formula: {:?}", uuid_regexp_formula);
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
                                    println!("Field: {:?}", field);
                                    // LOOP THROUGH ALL THE RETRIEVED DOCS
                                    let mut finding_string = field.as_text().unwrap();
                                    println!("Finding String: {:?}", finding_string);
                                    let mut non_unwrapped_result_uuid =
                                        uuid_regexp.captures(finding_string);

                                    let has_value = non_unwrapped_result_uuid;
                                    let mut found_uuid = true;
                                    let mut found_uuid_value = "".to_string();
                                    let has_value = match uuid_regexp.captures(finding_string) {
                                        Some(caps) => {
                                            found_uuid = true;
                                            found_uuid_value = caps[1].to_string();
                                            println!("Has Value: {:?}", &caps[1]);
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
                                        println!("Result: {:?}", result);
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
                                                            println!("Number: {:?}", num);

                                                        number_list.push(num);
                                                        }catch err {

                                                        }

                                                    }
                                                } else if is_date {
                                                    catch! {
                                                     try{
                                                         date_list.push(
                                                            parse(val.to_string().as_str())?.naive_utc(),
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
                                    println!("Non Unwrapped Result: {:?}", non_unwrapped_result);
                                    if (non_unwrapped_result.is_none()) {
                                        continue;
                                    }
                                    let result = non_unwrapped_result.unwrap();
                                    println!("Result: {:?}", result);
                                    if is_str {
                                        println!("Text: {:?}", result["text"].to_string());
                                        string_list.push(result["text"].to_string());
                                    } else if is_num {
                                        println!("Number: {:?}", result["number"].to_string());

                                        number_list.push(result["number"].parse::<f64>().unwrap());
                                    } else if is_date {
                                        date_list
                                            .push(result["date"].parse::<NaiveDateTime>().unwrap());
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
                    searcher,
                    schema,
                    formula_list,
                    formula,
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
                println!("Ans: {:?}", ans);
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
                println!("Ans: {:?}", ans);

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
                println!("Ans: {:?}", ans);
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
            for inner_pair in pair.into_inner() {
                let ans = recursive_funcation_parser(
                    inner_pair.clone(),
                    searcher.clone(),
                    schema.clone(),
                    formula_list.clone(),
                    formula.clone(),
                );

                println!("Ans: {:?}", ans);
                match ans {
                    TypeOr::Right(value) => val = TypeOr::Right(round(value as f64, 0) as f64),
                    TypeOr::RightList(value) => {
                        val = TypeOr::RightList(
                            value.iter().map(|x| round(*x as f64, 0) as f64).collect(),
                        )
                    }
                    any => return TypeOr::None,
                };
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
        Rule::number => return TypeOr::Right(pair.as_str().parse::<f64>().unwrap()),
        Rule::text => {
            for inner_pair in pair.into_inner() {
                if inner_pair.as_rule() == Rule::text_val {
                    return TypeOr::Left(inner_pair.as_str().to_string());
                }
            }
            return TypeOr::Left("".to_string());
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
                        println!("Error: {:?}", ans);
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
                if inner_pair.as_rule() == Rule::COMPARATOR {
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
                        let ans = recursive_funcation_parser(
                            compare_pair.clone(),
                            searcher.clone(),
                            schema.clone(),
                            formula_list.clone(),
                            formula.clone(),
                        );
                        if (is_left) {
                            left_answer = ans;
                            is_left = false;
                        } else {
                            right_answer = ans;
                        }
                        if compare_pair.as_rule() == Rule::COMPARATOR_SIGN {
                            let sign = compare_pair.as_str();
                            if sign == "==" {
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
                        println!("Left: {:?}", isLTE);
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
                            println!("Left: {:?}", left_list <= right_list);
                            final_ans = left_list <= right_list;
                        } else {
                            final_ans = false;
                        }
                    }
                }
                println!("Final Ans: {:?}", final_ans);
                println!("Rule IF: {:?}", inner_pair.as_rule());

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
                        let ans = recursive_funcation_parser(
                            compare_pair.clone(),
                            searcher.clone(),
                            schema.clone(),
                            formula_list.clone(),
                            formula.clone(),
                        );
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
                        // match ans.clone() {
                        //     TypeOr::Right(val) => {
                        //         if compare_pair.as_rule() == Rule::number {
                        //             ans = TypeOr::RightList([val].to_vec());
                        //         }
                        //     }
                        //     TypeOr::Left(val) => {
                        //         if compare_pair.as_rule() == Rule::text {
                        //             ans = TypeOr::LeftList([val].to_vec());
                        //         }
                        //     }
                        //     _ => {}
                        // }

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
                                total += 1.0;
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
                                total += 1.0;
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
                                total += 1.0;
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
                                total += 1.0;
                            }
                        } else {
                            return TypeOr::None;
                        }
                    }
                }
            }
            return TypeOr::Right(total);
        }

        _ => {
            print!("Unreachable");
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
        let retrieved_doc = searcher.doc(doc_address)?;
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
