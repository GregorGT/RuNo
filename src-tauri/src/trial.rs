use std::fs::File;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use sha2::{Digest, Sha256};

const TRIAL_DURATION_DAYS: u64 = 14;
const TRIAL_FILE_NAME: &str = "system_32.dat";

fn get_trial_file_path() -> PathBuf {
    #[cfg(target_os = "windows")]
    let data_dir = std::env::var("PROGRAMDATA").unwrap_or_else(|_| "C:/ProgramData".to_string());
    
    #[cfg(target_os = "macos")]
    let data_dir = dirs::data_dir().unwrap_or_else(|| PathBuf::from("/Library/Application Support"));
    
    #[cfg(target_os = "linux")]
    let data_dir = dirs::data_dir().unwrap_or_else(|| PathBuf::from("/var/lib"));
    
    PathBuf::from(data_dir).join(TRIAL_FILE_NAME)
}

/// Generate SHA256 hash of the given timestamp.
fn hash_timestamp(timestamp: u64) -> String {
    let mut hasher = Sha256::new();
    hasher.update(timestamp.to_string().as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Create the trial file if it doesn't exist, with the hashed current timestamp.
fn initialize_trial_file() -> Result<(), String> {
    let file_path = get_trial_file_path();
    
    if !file_path.exists() {
        let start_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let hash = hash_timestamp(start_time);
        let content = format!("{start_time}:{hash}");
        
        let mut file = File::create(file_path).expect("Trial date file create failed");
        file.write_all(content.as_bytes())
            .expect("Trial date write failed");
    }
    Ok(())
}

/// Validate the trial file and check if still within allowed period.
#[tauri::command]
pub fn is_trial_valid() -> Result<bool, String> {
    initialize_trial_file()?; // Ensure the file exists

    let file_path = get_trial_file_path();
    let mut content = String::new();
    File::open(&file_path)
        .expect("Trial date file open failed")
        .read_to_string(&mut content)
        .expect("Trial date file read failed");

    let parts: Vec<&str> = content.split(':').collect();
    if parts.len() != 2 {
        return Err("Trial file corrupted".into());
    }

    let start_time: u64 = parts[0].parse().map_err(|_| "Invalid timestamp")?;
    let stored_hash = parts[1];

    // Verify hash
    if stored_hash != hash_timestamp(start_time) {
        return Err("Trial file tampered".into());
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let elapsed_days = (now - start_time) / 86400;

    Ok(elapsed_days > TRIAL_DURATION_DAYS)
}