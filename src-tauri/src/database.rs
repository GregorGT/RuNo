// use tauri::command;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::mysql::MySqlPool;
use sqlx::postgres::PgPool;
use sqlx::sqlite::SqlitePool;
use sqlx::{postgres::PgRow, Column, Row, TypeInfo};

// use oracle::Connection;
use oracle::{ColumnInfo, Connector, Privilege};
use tauri::async_runtime;
#[derive(Debug, Serialize, Deserialize, PartialEq, PartialOrd, Clone)]
pub struct ConnectionConfig {
    pub name: String,
    pub r#type: String,
    pub url: String,
    pub database: Option<String>, // Optional for PostgreSQL
    pub port: Option<u16>,        // Optional for SQLite
    pub user: Option<String>,     // Optional for SQLite
    pub password: Option<String>, // Optional for SQLite
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
                }
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
                }
                Err(e) => {
                    println!("MySQL connection failed: {}", e);
                    false
                }
            }
        }
        "PostgreSQL" => {
            let user = config.user.as_deref().unwrap_or("postgres");
            let password = config.password.as_deref().unwrap_or("");
            let database = config.database.as_deref().unwrap_or("postgres");
            let port = config.port.unwrap_or(5432);

            let connection_string = format!(
                "postgres://{}:{}@{}:{}/{}",
                user, password, config.url, port, database
            );
            println!("PostgreSQL Connection String: {}", connection_string);

            match PgPool::connect(&connection_string).await {
                Ok(_) => {
                    println!("PostgreSQL connection successful!");
                    true
                }
                Err(e) => {
                    println!("PostgreSQL connection failed: {}", e);
                    false
                }
            }
        }
        "Oracle" => {
            let port = config.port.unwrap_or(1521);
            let database = config.database.as_deref().unwrap_or("");
            let connection_string = format!("//{}:{}/{}", config.url, port, database);
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
                Ok(Ok(false)) => {
                    // Handle the false case explicitly
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

// Function to extract sql query from given sql formula
pub fn extract_sql_query(sql_formula: &str) -> String {
    sql_formula
        .split(", \"")
        .nth(1)
        .and_then(|s| s.strip_suffix("\")"))
        .or_else(|| {
            sql_formula
                .strip_prefix("\"")
                .and_then(|s| s.strip_suffix("\""))
        })
        .unwrap_or(sql_formula)
        .to_string()
}

pub async fn execute_query(
    conn: &ConnectionConfig,
    query: &str,
) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
    match conn.r#type.as_str() {
        "SQLite" => execute_sqlite_query(conn, query).await,
        "MySQL" => execute_mysql_query(conn, query).await,
        "PostgreSQL" => execute_postgres_query(conn, query).await,
        "Oracle" => execute_oracle_query(conn, query).await,
        _ => Err(format!("Unsupported DB type: {}", conn.r#type).into()),
    }
}

async fn execute_sqlite_query(
    conn: &ConnectionConfig,
    query: &str,
) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
    let pool = SqlitePool::connect(&format!("sqlite://{}", conn.url)).await?;
    let rows = sqlx::query(query).fetch_all(&pool).await?;
    Ok(sqlite_rows_to_json(rows))
}

async fn execute_mysql_query(
    conn: &ConnectionConfig,
    query: &str,
) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
    let db_url = format!(
        "mysql://{}:{}@{}:{}/{}",
        conn.user.as_deref().unwrap_or("root"),
        conn.password.as_deref().unwrap_or(""),
        conn.url,
        conn.port.unwrap_or(3306),
        conn.database.as_deref().unwrap_or("")
    );
    let pool = MySqlPool::connect(&db_url).await?;
    let rows = sqlx::query(query).fetch_all(&pool).await?;
    Ok(mysql_rows_to_json(rows))
}

async fn execute_postgres_query(
    conn: &ConnectionConfig,
    query: &str,
) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
    let db_url = format!(
        "postgres://{}:{}@{}:{}/{}",
        conn.user.as_deref().unwrap_or("postgres"),
        conn.password.as_deref().unwrap_or(""),
        conn.url,
        conn.port.unwrap_or(5432),
        conn.database.as_deref().unwrap_or("postgres")
    );
    let pool = PgPool::connect(&db_url).await?;
    let rows = sqlx::query(query).fetch_all(&pool).await?;
    Ok(postgres_rows_to_json(rows))
}

async fn execute_oracle_query(
    conn: &ConnectionConfig,
    query: &str,
) -> Result<Vec<serde_json::Value>, Box<dyn std::error::Error>> {
    let conn_clone = conn.clone();
    let port = conn_clone.port.unwrap_or(1521);
    let database = conn_clone.database.as_deref().unwrap_or("");
    let connection_string = format!("//{}:{}/{}", conn_clone.url, port, database);
    let username = conn_clone.user.clone().unwrap_or_default();
    let password = conn_clone.password.clone().unwrap_or_default();

    let connection = tokio::task::spawn_blocking(move || {
        oracle::Connector::new(&username, &password, &connection_string)
            .privilege(oracle::Privilege::Sysdba)
            .connect()
    })
    .await??;

    let rows = connection.query(query, &[])?.collect::<Vec<_>>();
    Ok(oracle_rows_to_json(rows))
}

fn sqlite_rows_to_json(rows: Vec<sqlx::sqlite::SqliteRow>) -> Vec<serde_json::Value> {
    rows.into_iter()
        .map(|row| {
            let mut map = serde_json::Map::new();
            for i in 0..row.len() {
                let column = row.columns().get(i).unwrap();
                let type_info = column.type_info().to_string();
                println!(
                    "[sqlite] column name {} and type is {:?}",
                    column.name(),
                    type_info
                );
                // let value = row
                //     .try_get::<String, _>(i)
                //     .map(Value::from)
                //     .or_else(|_| row.try_get::<f64, _>(i).map(Value::from))
                //     .or_else(|_| row.try_get::<i64, _>(i).map(Value::from))
                //     .unwrap_or(Value::Null);

                let value = match type_info.as_str() {
                    "INTEGER" => row.try_get::<i64, _>(i).ok().map(serde_json::Value::from),
                    "TEXT" => row
                        .try_get::<String, _>(i)
                        .ok()
                        .map(serde_json::Value::from),
                    "REAL" => row.try_get::<f64, _>(i).map(serde_json::Value::from).ok(),
                    "DATETIME" | "DATE" | "TIMESTAMP" => row
                        .try_get::<String, _>(i)
                        .ok()
                        .map(serde_json::Value::from),
                    _ => None,
                }
                .unwrap_or_else(|| {
                    // Ultimate fallback - try to get as text
                    row.try_get::<String, _>(i)
                        .map(serde_json::Value::from)
                        .or_else(|_| row.try_get::<f64, _>(i).map(Value::from))
                        .or_else(|_| row.try_get::<i64, _>(i).map(Value::from))
                        .or_else(|_| row.try_get::<u64, _>(i).map(Value::from))
                        .or_else(|_| row.try_get::<u32, _>(i).map(Value::from))

                        .unwrap_or(serde_json::Value::Null)
                });
                map.insert(column.name().to_string(), value);
            }
            serde_json::Value::Object(map)
        })
        .collect()
}

fn mysql_rows_to_json(rows: Vec<sqlx::mysql::MySqlRow>) -> Vec<Value> {
    rows.into_iter()
        .map(|row| {
            let mut map = serde_json::Map::new();
            for i in 0..row.len() {
                let column = row.columns().get(i).unwrap();
                let type_info = column.type_info().to_string();
                println!(
                    "[mysql] column name {} and type is {:?}",
                    column.name(),
                    type_info
                );
                let value = match type_info.as_str() {
                    "INT" | "BIGINT" => row.try_get::<i64, _>(i).ok().map(Value::from),
                    "VARCHAR" | "TEXT" => row.try_get::<String, _>(i).ok().map(Value::from),
                    "FLOAT" | "DOUBLE" => row.try_get::<f64, _>(i).ok().map(Value::from),
                    "DATE" | "DATETIME" | "TIMESTAMP" => {
                        row.try_get::<String, _>(i).ok().map(Value::from)
                    }
                    _ => None,
                }
                .unwrap_or_else(|| {
                    // Ultimate fallback - try to get as text
                    row.try_get::<String, _>(i)
                        .map(Value::from)
                        .or_else(|_| row.try_get::<f64, _>(i).map(Value::from))
                        .or_else(|_| row.try_get::<i64, _>(i).map(Value::from))

                        .or_else(|_| row.try_get::<u64, _>(i).map(Value::from))
                        .or_else(|_| row.try_get::<u32, _>(i).map(Value::from))

                        .or_else(|_| {
                            row.try_get::<chrono::NaiveDateTime, _>(i)
                                .map(|dt| Value::from(dt.to_string()))
                        })
                        .or_else(|_| {
                            row.try_get::<chrono::NaiveDate, _>(i)
                                .map(|dt| Value::from(dt.to_string()))
                        })
                        .unwrap_or(Value::Null)
                });
                map.insert(column.name().to_string(), value);
            }
            serde_json::Value::Object(map)
        })
        .collect()
}

fn postgres_rows_to_json(rows: Vec<PgRow>) -> Vec<Value> {
    rows.into_iter()
        .map(|row| {
            let mut map = serde_json::Map::new();
            for i in 0..row.len() {
                let column = row.columns().get(i).unwrap();
                println!(
                    "[postgres] column name {} and type is {:?}",
                    column.name(),
                    column.type_info()
                );
                let value = match column.type_info().name() {
                    "INT4" => row.try_get::<i32, _>(i).ok().map(Value::from),
                    "INT8" => row.try_get::<i64, _>(i).ok().map(Value::from),
                    "VARCHAR" | "TEXT" => row.try_get::<String, _>(i).ok().map(Value::from),
                    "FLOAT4" => row.try_get::<f32, _>(i).ok().map(Value::from),
                    "FLOAT8" => row.try_get::<f64, _>(i).ok().map(Value::from),
                    "BOOL" => row.try_get::<bool, _>(i).ok().map(Value::from),
                    "DATE" | "TIMESTAMP" | "TIMESTAMPTZ" => {
                        row.try_get::<String, _>(i).ok().map(Value::from)
                    }
                    _ => None,
                }
                .unwrap_or_else(|| {
                    row.try_get::<String, _>(i)
                        .map(Value::from)
                        .or_else(|_| row.try_get::<f64, _>(i).map(Value::from))
                        .or_else(|_| row.try_get::<i64, _>(i).map(Value::from))
                        .or_else(|_| {
                            row.try_get::<chrono::NaiveDateTime, _>(i)
                                .map(|dt| Value::from(dt.to_string()))
                        })
                        .or_else(|_| {
                            row.try_get::<chrono::NaiveDate, _>(i)
                                .map(|dt| Value::from(dt.to_string()))
                        })
                        .unwrap_or(Value::Null)
                });
                map.insert(column.name().to_string(), value);
            }
            serde_json::Value::Object(map)
        })
        .collect()
}

fn oracle_rows_to_json(rows: Vec<Result<oracle::Row, oracle::Error>>) -> Vec<Value> {
    rows.into_iter()
        .filter_map(|row_result| {
            row_result.ok().map(|row| {
                let mut map = serde_json::Map::new();
                for (i, column) in row.column_info().iter().enumerate() {
                    let value = if let Ok(val) = row.get::<_, String>(i) {
                        Value::String(val)
                    } else if let Ok(val) = row.get::<_, i64>(i) {
                        Value::from(val)
                    } else if let Ok(val) = row.get::<_, f64>(i) {
                        Value::from(val)
                    } else {
                        Value::Null
                    };
                    map.insert(column.name().to_string(), value);
                }
                Value::Object(map)
            })
        })
        .collect()
}
