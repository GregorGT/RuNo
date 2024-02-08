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
    // CreateIndex().unwrap();
    AddDocument().unwrap();
    SearchData().unwrap();
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
use tantivy::schema::*;
use tantivy::{doc, Index, ReloadPolicy, Result};

const example: &str = r#"<html>
        <head>
            <title>My title</title>
        </head>
        <body>
            <p>Hello, world!</p>
            <p>this is the test for <span>search</span> engine</p>
            <p>this is the test for <span>search</span> package</p>
            <p>this is the test for </p>
        </body>
    </html>"#;

fn CreateIndex() -> Result<()> {
    let schema = Schema::builder().build();
    let path = Path::new("data");
    let _index = Index::create_in_dir(&path, schema)?;
    Ok(())
}

fn AddDocument() -> Result<()> {
    // check if the data directory exists
    let is_dir = Path::new("data").exists();
    if (is_dir) {
        fs::remove_dir_all("data")?;
    }

    let mut schema_builder = Schema::builder();
    schema_builder.add_u64_field("line", STORED);
    schema_builder.add_text_field("body", STORED | TEXT);

    let path = Path::new("data");
    fs::create_dir_all(path)?;
    let index = Index::create_in_dir(&path, schema_builder.build())?;

    let schema = index.schema();
    let mut index_writer = index.writer(50_000_000)?;
    let body_field = schema.get_field("body").unwrap();
    let line_number = schema.get_field("line").unwrap();

    let body = strip_html(example);
    //split body by \n and loop through it
    let body = body.split("\n").collect::<Vec<&str>>();
    // TODO maybe we can improve this
    for (i, line) in body.iter().enumerate() {
        let doc = doc!(
            line_number => i as u64,
            body_field => line.to_string(),
        );
        let _ = index_writer.add_document(doc);
    }
    index_writer.commit()?;
    Ok(())
}
use tantivy::collector::{BytesFilterCollector, Count, TopDocs};
use tantivy::directory::MmapDirectory;
use tantivy::query::{PhrasePrefixQuery, QueryParser};

fn SearchData() -> Result<()> {
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
    let queryText = "search engine";

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
    let mut data = String::new();
    let mut inside = false;
    // Step 1: loop over string chars.
    for c in source.chars() {
        // Step 2: detect markup start and end, and skip over markup chars.
        if c == '<' {
            inside = true;
            continue;
        }
        if c == '>' {
            inside = false;
            continue;
        }
        if !inside {
            // Step 3: push other characters to the result string.
            data.push(c); // We can remove whitespace
        }
    }
    // Step 4: return string.
    return data;
}
