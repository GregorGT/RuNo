use std::{env::current_exe, fs, io, path::Path};

use tauri::{path::BaseDirectory, Manager};
//use super::applicationdirs::get_application_db_directory;

use regex::Regex;
use tantivy::{
    collector::{Count, TopDocs},
    directory::{MmapDirectory, RamDirectory},
    doc,
    query::{PhrasePrefixQuery, QueryParser, TermQuery, TermSetQuery, Union},
    query_grammar::UserInputAst,
    schema::{self, Field, Schema, INDEXED, STORED, TEXT},
    Directory, DocAddress, Index, ReloadPolicy, Searcher, Term,
};
//use tauri::api::path::local_data_dir;
pub fn get_schema_current(ram_dir: &RamDirectory) -> tantivy::Result<tantivy::Index> {
    let mut schema_builder = Schema::builder();
    schema_builder.add_u64_field("line", STORED);
    schema_builder.add_u64_field("entry", STORED | INDEXED);
    schema_builder.add_text_field("body", TEXT | STORED);
    let local_data_dir_path = super::applicationdirs::get_application_db_directory(); //app.path().resolve("", BaseDirectory::Config).unwrap();//local_data_dir().unwrap();
                                                                                      // let path = Path::new("data");
                                                                                      // if !path.exists() {
                                                                                      //     fs::create_dir_all(path)?;
                                                                                      // }
    let index_dir = MmapDirectory::open(local_data_dir_path)?;

    let index = Index::open_or_create(ram_dir.clone(), schema_builder.build())?;

    Ok(index)
}

pub fn get_schema(ram_dir: RamDirectory) -> tantivy::Result<tantivy::Index> {
    let mut schema_builder = Schema::builder();
    schema_builder.add_u64_field("line", STORED);
    schema_builder.add_u64_field("entry", STORED | INDEXED);
    schema_builder.add_text_field("body", TEXT | STORED);
    let local_data_dir_path = super::applicationdirs::get_application_db_directory(); //(app.path().resolve("", BaseDirectory::Config).unwrap()).join("runo");
    if !local_data_dir_path.exists() {
        fs::create_dir_all(local_data_dir_path.clone())?;
    }
    println!("Local Data Dir: {:?}", local_data_dir_path);
    let index_dir = MmapDirectory::open(local_data_dir_path)?;

    let index = Index::open_or_create(ram_dir.clone(), schema_builder.build())?;

    Ok(index)
}

pub fn add_inital_docs(ram_dir: RamDirectory, data: Vec<Vec<String>>) -> tantivy::Result<()> {
    let index = get_schema(ram_dir.to_owned()).unwrap();

    let schema = index.schema();
    let mut index_writer = index.writer(50_00000_000)?;
    let body_field = schema.get_field("body").unwrap();
    let line_number = schema.get_field("line").unwrap();
    let entry = schema.get_field("entry").unwrap();
    for (entry_num, chunk) in data.iter().enumerate() {
        for (i, line) in chunk.iter().enumerate() {
            let doc = doc!(
                line_number => i as u64,
                body_field => line.to_string(),
                entry => entry_num as u64
            );
            let _ = index_writer.add_document(doc);
        }
    }

    index_writer.commit()?;
    let _ = ram_dir.sync_directory();
    Ok(())
}

pub fn add_document_to_entry(
    index: Index,
    ram_dir: RamDirectory,
    entry_index: u64,
    data: String,
) -> tantivy::Result<()> {
    let schema = index.schema();
    let mut index_writer = index.writer(50_00000_000)?;
    let body_field = schema.get_field("body").unwrap();
    let line_number = schema.get_field("line").unwrap();
    let entry = schema.get_field("entry").unwrap();
    //
    let lines = data.split("\n").collect::<Vec<&str>>();
    for (i, line) in lines.iter().enumerate() {
        let doc = doc!(
            line_number => i as u64,
            body_field => line.to_string(),
            entry => entry_index as u64
        );
        let _ = index_writer.add_document(doc);
    }

    index_writer.commit()?;
    let _ = ram_dir.sync_directory();
    Ok(())
    // We can loop through string and add each string as a document to save
}

pub fn delete_document_from_entry(entry_index: u64, index: Index) -> tantivy::Result<()> {
    let schema = index.schema();
    let mut index_writer = index.writer(50_00000_000)?;
    let entry = schema.get_field("entry").unwrap();
    index_writer.delete_term(Term::from_field_u64(entry, entry_index));
    index_writer.commit()?;
    Ok(())
}
pub fn get_searcher(index: Index) -> tantivy::Result<Searcher> {
    let reader = index
        .reader_builder()
        .reload_policy(ReloadPolicy::OnCommit)
        .try_into()
        .unwrap();

    Ok(reader.searcher())
}

pub fn break_html(source: &str) -> Vec<String> {
    // This function breaks html with hr tag
    source
        .split("<hr/>")
        .map(|x| x.to_string())
        .filter(|x| x.len() > 0)
        .collect()
}

#[derive(Debug)]
struct formula {
    line: u64,
    formula: String,
}

pub fn search_data(
    query: &str,
    searcher: Searcher,
    schema: Schema,
    entry_ids: Vec<u64>,
    is_initial: bool,
) -> tantivy::Result<Vec<(f32, DocAddress)>> {
    let sanatized_query = replace_list_from_string(
        vec![
            "{TEXT}".to_string(),
            "{NUMBER}".to_string(),
            "{DATE}".to_string(),
        ],
        query,
    );

    let body = schema.get_field("body").unwrap();
    let entry_id = schema.get_field("entry").unwrap();

    let mut query_parser = QueryParser::for_index(searcher.index(), vec![body]);
    // query_parser.set_field_boost(body, 3.0);
    // query_parser.set_field_boost(entry_id, 4.0);
    let mut query_string: String;

    if (is_initial) {
        // Create string with template
        query_string = format!("\"{:}\"", sanatized_query);
    } else {
        query_string = format!(
            "\"{:}\" AND entry: IN [{:}]",
            sanatized_query,
            entry_ids
                .iter()
                .map(|x| x.to_string())
                .collect::<Vec<String>>()
                .join(" ")
        );
    }

    // let termQue
    let tantivy_query = query_parser.parse_query(query_string.as_str())?;
    // print!("hrere");

    let (top_docs, _) = searcher
        .search(&tantivy_query, &(TopDocs::with_limit(10000), Count))
        .unwrap();
    // println!("Top Docs: {:?}", top_docs.len());

    // top docs contains all the data so function calling will make use of this data in 2 ways
    // 1. If its for specific entry than it will be useful to use for it only
    // 2. If its for all entries we can take docs OR entryId based on query defined
    return Ok(top_docs);

    // let make_regexp = Regex::new(query.replace("{NUMBER}", r"(?<number>\d+)").as_str());
    // let mut found_numbers_list: Vec<i64> = Vec::new();
    // for (_, doc_address) in top_docs {
    //     let retrieved_doc = searcher.doc(doc_address)?;

    //     for field in retrieved_doc.get_all(body).into_iter() {
    //         let selectedField = field.as_text().unwrap();
    //         let result = make_regexp
    //             .as_ref()
    //             .unwrap()
    //             .captures(selectedField)
    //             .unwrap();
    //         // cjeck if result of number exists

    //         let number = result["number"].parse::<i64>().unwrap();
    //         found_numbers_list.push(number);
    //     }
    // }

    // return Ok([].to_vec());
}

pub fn replace_list_from_string(list: Vec<String>, string: &str) -> String {
    let mut new_string = string.to_string();
    for (_, item) in list.iter().enumerate() {
        new_string = new_string.replace(item, "");
    }
    new_string
}
