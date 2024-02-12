// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use command::{
    create_new_gist, get_commits_to_repository, get_gist_content, get_gists_for_authenticated_user,
    get_public_gists, get_public_repositories, get_repositories_for_authenticated_user,
    get_users_associated_with_repository, template_message_box_call,
};

mod api;
mod command;
mod error;
mod models;

fn main() {
    let is_dir = Path::new("data").exists();
    if (is_dir) {
        fs::remove_dir_all("data");
    }
    // CreateIndex().unwrap();
    add_document().unwrap();
    search_data().unwrap();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_new_gist,
            get_public_gists,
            get_public_repositories,
            get_repositories_for_authenticated_user,
            get_gists_for_authenticated_user,
            get_gist_content,
            get_users_associated_with_repository,
            get_commits_to_repository,
            template_message_box_call
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
use std::path::Path;
use std::{fs, string};
use tantivy::{doc, Directory, Index, ReloadPolicy, Result, TantivyError};
use tantivy::{schema::*, IndexWriter};

const example: &str = r#"<html>
        <head>
            <title>My title</title>
        </head>
        <body>
            <p>Hello, world!</p>
            <p>this is the test for <span>search</span> engine</p>
            <hr/>
            <p>this is the test for <span>search</span> package</p>
            <p>this is the test for <span>search</span> engine</p>
            <p>this is the test for </p>
        </body>
    </html>"#;

fn create_index() -> Result<()> {
    let schema = Schema::builder().build();
    let path = Path::new("data");
    let _index = Index::create_in_dir(&path, schema)?;
    Ok(())
}
fn get_schema() -> Result<Index> {
    let mut schema_builder = Schema::builder();
    schema_builder.add_u64_field("line", STORED);
    schema_builder.add_u64_field("entry", STORED);
    schema_builder.add_text_field("body", STORED | TEXT);
    let path = Path::new("data");
    // Check if dir exists

    if path.exists() {
        let index_dir = MmapDirectory::open(path)?;
        let index = Index::open(index_dir)?;

        return Ok(index);
    }

    fs::create_dir_all(path)?;
    let index = Index::create_in_dir(&path, schema_builder.build())?;
    Ok(index)
}
fn add_line() -> Result<()> {
    let index = get_schema().unwrap();
    let schema = index.schema();
    let mut index_writer = index.writer(50_000_000)?;
    let body_field = schema.get_field("body").unwrap();
    let line_number = schema.get_field("line").unwrap();
    let entry = schema.get_field("entry").unwrap();
    let doc = doc!(
        line_number => 10 as u64,
        body_field => "test search engine".to_string(),
        entry => 0 as u64
    );
    assert_eq!(index_writer.add_document(doc).is_ok(), true);
    assert_eq!(index_writer.commit().is_ok(), true);
    Ok(())
}

fn add_document() -> Result<()> {
    let index = get_schema().unwrap();

    let schema = index.schema();
    let mut index_writer = index.writer(50_000_000)?;
    let body_field = schema.get_field("body").unwrap();
    let line_number = schema.get_field("line").unwrap();
    let entry = schema.get_field("entry").unwrap();

    let body = strip_html_with_break(example);

    for (entry_index, line) in body.iter().enumerate() {
        let lines = line.split("\n").collect::<Vec<&str>>();
        for (i, line) in lines.iter().enumerate() {
            let doc = doc!(
                line_number => i as u64,
                body_field => line.to_string(),
                entry => entry_index as u64
            );
            let _ = index_writer.add_document(doc);
        }
    }
    let _ = add_line();

    index_writer.commit()?;

    Ok(())
}
use tantivy::collector::{BytesFilterCollector, Count, TopDocs};
use tantivy::directory::MmapDirectory;
use tantivy::query::{PhrasePrefixQuery, QueryParser};

fn search_data() -> Result<()> {
    let path = Path::new("data");
    let index_dir = MmapDirectory::open(path)?;
    let index = Index::open(index_dir)?;
    let schema = index.schema();

    let body = schema.get_field("body").unwrap();
    let reader = index
        .reader_builder()
        .reload_policy(ReloadPolicy::OnCommit)
        .try_into()?;

    let searcher = reader.searcher();

    let query = "search engine";
    let query_whitespace_split: Vec<&str> = query.split_whitespace().collect();
    let term_queries: Vec<Term> = query_whitespace_split
        .iter()
        .map(|term| Term::from_field_text(body, term))
        .collect();
    let phrase_query = PhrasePrefixQuery::new(term_queries);

    let (top_docs, count) = searcher
        .search(&phrase_query, &(TopDocs::with_limit(5), Count))
        .unwrap();

    for (score, doc_address) in top_docs {
        let retrieved_doc = searcher.doc(doc_address)?;
        println!("score {score:?} doc {}", schema.to_json(&retrieved_doc));
    }
    Ok(())
}

fn strip_html(source: &str) -> String {
    let mut inside = false;
    let mut result = String::new();
    for c in source.chars() {
        if c == '<' {
            inside = true;
            continue;
        }
        if c == '>' {
            inside = false;
            continue;
        }
        if !inside {
            result.push(c);
        }
    }
    return result;
}

fn strip_html_with_break(source: &str) -> Vec<String> {
    let mut inside = false;
    let mut break_index = 0;

    let mut vector_string: Vec<String> = Vec::new();
    let mut current_iteration = 0;
    vector_string.push("".to_string());

    for c in source.chars() {
        current_iteration += 1;
        if source.chars().nth(current_iteration) == Some('<')
            && source.chars().nth(current_iteration + 1) == Some('h')
            && source.chars().nth(current_iteration + 2) == Some('r')
        {
            break_index += 1;
            vector_string.push("".to_string())
        }

        if c == '<' {
            inside = true;
            continue;
        }
        if c == '>' {
            inside = false;
            continue;
        }
        if !inside {
            vector_string[break_index].push(c);
        }
    }
    return vector_string;
}
