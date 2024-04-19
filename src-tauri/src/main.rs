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
use command::run_command;
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_command, assign_entry_id,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
