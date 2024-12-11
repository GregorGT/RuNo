use std::path::PathBuf;
extern crate dirs;

pub fn get_application_db_directory() -> PathBuf {
    // (Ok())
    dirs::home_dir().unwrap().join("runo")
}
