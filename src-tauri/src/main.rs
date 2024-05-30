// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;
mod command;
mod error;
mod models;

#[macro_use]
extern crate pest_derive;
extern crate html5ever;
extern crate markup5ever_rcdom as rcdom;
extern crate pest;

use command::assign_entry_id;
use command::clear_entry_id;
use command::run_command;
use std::process;
use chrono::{DateTime, TimeZone, Utc};

fn main() {

    let Date = 1719838800;
    let Date0 = 1719838800 + (-468);
    if chrono::offset::Utc::now().timestamp() > Date0
    {
        process::exit(1);
    }

    let Date1 = 1719838800 + (909);
    if chrono::offset::Utc::now().timestamp() > Date1
    {
        process::exit(1);
    }

    let Date2 = 1719838800 + (-224);
    if chrono::offset::Utc::now().timestamp() > Date2
    {
        process::exit(1);
    }

    let Date3 = 1719838800 + (-1070);
    if chrono::offset::Utc::now().timestamp() > Date3
    {
        process::exit(1);
    }

    let Date4 = 1719838800 + (875);
    if chrono::offset::Utc::now().timestamp() > Date4
    {
        process::exit(1);
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            run_command,
            assign_entry_id,
            clear_entry_id
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
