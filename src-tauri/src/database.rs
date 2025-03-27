// use tauri::command;
use sqlx::sqlite::SqlitePool;
use sqlx::mysql::MySqlPool;
use sqlx::postgres::PgPool;
use serde::{Serialize, Deserialize};
// use oracle::Connection;
use oracle::{Connector, Privilege};
use tauri::async_runtime;
#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub name: String,
    pub r#type: String,
    pub url: String,
    pub database: Option<String>,// Optional for PostgreSQL
    pub port: Option<u16>,       // Optional for SQLite
    pub user: Option<String>,    // Optional for SQLite
    pub password: Option<String>,// Optional for SQLite
}

#[tauri::command]
pub async fn test_connection(config: ConnectionConfig) -> bool {
  println!("Testing connection for: {:?}", config);

  match config.r#type.as_str() {
      "SQLite" => {
          let path = format!("sqlite://{}", config.url);
          println!("SQLite Path: {}", path);
          
          match SqlitePool::connect(&path).await {
              Ok(_) => {
                  println!("SQLite connection successful!");
                  true
              },
              Err(e) => {
                  println!("SQLite connection failed: {}", e);
                  false
              }
          }
      }
      "MySQL" => {
          let connection_string = format!(
              "mysql://{}:{}@{}:{}/{}",
              config.user.as_deref().unwrap_or("root"),
              config.password.as_deref().unwrap_or(""),
              config.url,
              config.port.unwrap_or(3306),
              config.database.as_deref().unwrap_or(""),
          );
          println!("MySQL Connection String: {}", connection_string);

          match MySqlPool::connect(&connection_string).await {
              Ok(_) => {
                  println!("MySQL connection successful!");
                  true
              },
              Err(e) => {
                  println!("MySQL connection failed: {}", e);
                  false
              }
          }
      }
      "PostgreSQL" => {
        let user = config.user.as_deref().unwrap_or("postgres");
        let password = config.password.as_deref().unwrap_or("");
        let database =config.database.as_deref().unwrap_or("postgres");
        let port = config.port.unwrap_or(5432);
        
        let connection_string =format!("postgres://{}:{}@{}:{}/{}",
                user, password, config.url, port,database
            );
          println!("PostgreSQL Connection String: {}", connection_string);

          match PgPool::connect(&connection_string).await {
              Ok(_) => {
                  println!("PostgreSQL connection successful!");
                  true
              },
              Err(e) => {
                  println!("PostgreSQL connection failed: {}", e);
                  false
              }
          }
      }
        "Oracle" => {
            let port = config.port.unwrap_or(1521);
            let database =config.database.as_deref().unwrap_or("");
            let connection_string = format!("//{}:{}/{}", config.url, port,database);
            let username = config.user.clone().unwrap_or_default();
            let password = config.password.clone().unwrap_or_default();            

            println!("Oracle Connection String: {}", connection_string);

            match async_runtime::spawn_blocking(move || {
                Connector::new(&username, &password, &connection_string)
                    .privilege(Privilege::Sysdba)
                    .connect()
                    .map(|_| true)
                    .map_err(|e| {
                        eprintln!("Oracle connection error: {}", e);
                        e
                    })
            })
            .await
            {
                Ok(Ok(true)) => {
                    println!("Oracle connection successful!");
                    true
                }
                Ok(Ok(false)) => {  // Handle the false case explicitly
                    println!("Oracle connection returned false");
                    false
                }
                Ok(Err(e)) => {
                    eprintln!("Oracle connection failed: {}", e);
                    false
                }
                Err(e) => {
                    eprintln!("Oracle async runtime error: {}", e);
                    false
                }
            }
        }
      _ => {
          println!("Unsupported database type: {}", config.r#type);
          false
      }
  }
}
