// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;
mod command;
mod database;
mod error;
mod license;
mod models;
#[macro_use]
extern crate pest_derive;
extern crate html5ever;
extern crate markup5ever_rcdom as rcdom;
extern crate pest;

use command::assign_entry_id;
use command::clear_entry_id;
use command::run_command;
use database::test_connection;
use license::{write_license_file, is_trial_valid, initialize_trial_file};
// use std::path::PathBuf;
// use std::process;

//use tauri_plugin_log::{Target, TargetKind};
// use chrono::{DateTime, TimeZone, Utc};
// use tauri::{path::BaseDirectory, Manager};
// use tauri::Runtime;

//static mut G_APP : tauri::App = None::<&tauri::Runtime>; //::<tauri::Runtime>;

//fn get_application_path() -> String {
//    _APPLICATION_PATH.to_str()//
//}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            run_command,
            assign_entry_id,
            clear_entry_id,
            test_connection,
            is_trial_valid,
            write_license_file,
            initialize_trial_file
        ])
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| Ok(()))
        //.plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        // .setup(|app| {
        //  let home_dir_path = app.path().home_dir().expect("failed to get home dir");
        //unsafe {
        // _APPLICATION_PATH = app.path().resolve("", BaseDirectory::Config).unwrap();
        //  let path = app.path().resolve("path/to/something", BaseDirectory::Config)?;
        // }
        //    Ok(())
        // });
        .expect("error while running tauri application");
}
