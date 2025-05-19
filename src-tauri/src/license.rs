use hex::encode;
use hmac::{Hmac, Mac};
use hostname::get;
use sha2::Sha256;
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use dirs_next::data_dir;

type HmacSha256 = Hmac<Sha256>;

const SECRET_KEY: &[u8] = b"dsaKJGGOIAVFQWERIUOPILKJHGFDDAYXCVV12345678990qwrzqtwghdsavjgqwambbcyxs
nvljsgpoui";

const TRIAL_DURATION_DAYS: u64 = 14;
const TRIAL_FILE_NAME: &str = "system_32.dat";
const LICENSE_FILE_NAME: &str = "runo_license.dat";

fn get_machine_name() -> String {
    get()
        .unwrap_or_else(|_| "unknown_machine".into())
        .to_string_lossy()
        .into_owned()
}

fn generate_license_content(machine_name: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(SECRET_KEY).expect("HMAC can take any key size");
    mac.update(machine_name.as_bytes());
    let result = mac.finalize().into_bytes();
    encode(result)
}

fn verify_license() -> bool {
    let mut path: PathBuf = data_dir().unwrap();
    path.push(LICENSE_FILE_NAME);

    if let Ok(content) = fs::read_to_string(path) {
        let machine_name = get_machine_name();
        let hashed_machine_name = generate_license_content(&machine_name);
        return hashed_machine_name == content;
    }

    false
}

fn hash_timestamp(timestamp: u64) -> String {
    let mut mac = HmacSha256::new_from_slice(SECRET_KEY).expect("HMAC can take any key size");
    mac.update(timestamp.to_string().as_bytes());
    let result = mac.finalize().into_bytes();
    encode(result)
}

/// Create the trial file if it doesn't exist, with the hashed current timestamp.
#[tauri::command]
pub fn initialize_trial_file() -> Result<(), String> {
    println!("initialize_trial_file");
    let mut file_path = data_dir().unwrap();
    file_path.push(TRIAL_FILE_NAME);

    println!("File path resolved to: {:?}", file_path);
    if !file_path.exists() {
        println!("Trial file does not exist, creating...");
        let start_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let hash = hash_timestamp(start_time);
        let content = format!("{start_time}:{hash}");

        let mut file = fs::File::create(file_path).expect("Trial date file create failed");
        file.write_all(content.as_bytes())
            .expect("Trial date write failed");

        println!("Trial file created with content: {}", content);
    } else {
        println!("Trial file already exists, skipping creation");
    }

    println!("initialize_trial_file completed successfully");
    Ok(())
}

#[tauri::command]
pub fn write_license_file() -> Result<bool, String> {
    let mut path = data_dir().unwrap();
    path.push(LICENSE_FILE_NAME);

    let machine_name = get_machine_name();
    let hashed_machine_name = generate_license_content(&machine_name);

    let content = format!("{}", hashed_machine_name);

    let mut file = fs::File::create(path).unwrap();
    file.write_all(content.as_bytes()).unwrap();

    Ok(true)
}

/// Validate the trial file and check if still within allowed period.
#[tauri::command]
pub fn is_trial_valid() -> Result<bool, String> {
    if verify_license() {
        // first check if valid license file exists.
        println!("Valid license file exists.");
        return Ok(false);
    }

    let mut file_path = data_dir().unwrap();
    file_path.push(TRIAL_FILE_NAME);

    let mut content = String::new();
    fs::File::open(&file_path)
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
    println!(
        "Trial period {} days remain",
        TRIAL_DURATION_DAYS - elapsed_days
    );
    Ok(elapsed_days > TRIAL_DURATION_DAYS)
}
