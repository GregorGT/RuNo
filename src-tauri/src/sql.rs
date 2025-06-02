use sqlx::{mysql::MySqlPool, postgres::PgPool, sqlite::SqlitePool};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::database::ConnectionConfig;

#[derive(Debug, Serialize, Deserialize)]
pub struct SqlResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<String>>,
}

#[derive(Debug)]
pub enum DatabasePool {
    MySQL(MySqlPool),
    PostgreSQL(PgPool),
    SQLite(SqlitePool),
}

pub async fn execute_query(config: &ConnectionConfig, query: &str) -> Result<SqlResult, String> {
    match config.r#type.as_str() {
        "MySQL" => execute_mysql_query(config, query).await,
        "PostgreSQL" => execute_postgres_query(config, query).await,
        "SQLite" => execute_sqlite_query(config, query).await,
        "Oracle" => execute_oracle_query(config, query).await,
        _ => Err("Unsupported database type".to_string()),
    }
}

async fn execute_mysql_query(config: &ConnectionConfig, query: &str) -> Result<SqlResult, String> {
    let connection_string = format!(
        "mysql://{}:{}@{}:{}/{}",
        config.user.as_deref().unwrap_or("root"),
        config.password.as_deref().unwrap_or(""),
        config.url,
        config.port.unwrap_or(3306),
        config.database.as_deref().unwrap_or(""),
    );

    let pool = MySqlPool::connect(&connection_string)
        .await
        .map_err(|e| e.to_string())?;

    let rows = sqlx::query(query)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut result = SqlResult {
        columns: Vec::new(),
        rows: Vec::new(),
    };

    if let Some(first_row) = rows.first() {
        result.columns = first_row
            .columns()
            .iter()
            .map(|col| col.name().to_string())
            .collect();
    }

    for row in rows {
        let mut row_data = Vec::new();
        for i in 0..row.columns().len() {
            let value: Option<String> = row.try_get(i).unwrap_or(None);
            row_data.push(value.unwrap_or_default());
        }
        result.rows.push(row_data);
    }

    Ok(result)
}

async fn execute_postgres_query(config: &ConnectionConfig, query: &str) -> Result<SqlResult, String> {
    let connection_string = format!(
        "postgres://{}:{}@{}:{}/{}",
        config.user.as_deref().unwrap_or("postgres"),
        config.password.as_deref().unwrap_or(""),
        config.url,
        config.port.unwrap_or(5432),
        config.database.as_deref().unwrap_or("postgres")
    );

    let pool = PgPool::connect(&connection_string)
        .await
        .map_err(|e| e.to_string())?;

    let rows = sqlx::query(query)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut result = SqlResult {
        columns: Vec::new(),
        rows: Vec::new(),
    };

    if let Some(first_row) = rows.first() {
        result.columns = first_row
            .columns()
            .iter()
            .map(|col| col.name().to_string())
            .collect();
    }

    for row in rows {
        let mut row_data = Vec::new();
        for i in 0..row.columns().len() {
            let value: Option<String> = row.try_get(i).unwrap_or(None);
            row_data.push(value.unwrap_or_default());
        }
        result.rows.push(row_data);
    }

    Ok(result)
}

async fn execute_sqlite_query(config: &ConnectionConfig, query: &str) -> Result<SqlResult, String> {
    let pool = SqlitePool::connect(&config.url)
        .await
        .map_err(|e| e.to_string())?;

    let rows = sqlx::query(query)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut result = SqlResult {
        columns: Vec::new(),
        rows: Vec::new(),
    };

    if let Some(first_row) = rows.first() {
        result.columns = first_row
            .columns()
            .iter()
            .map(|col| col.name().to_string())
            .collect();
    }

    for row in rows {
        let mut row_data = Vec::new();
        for i in 0..row.columns().len() {
            let value: Option<String> = row.try_get(i).unwrap_or(None);
            row_data.push(value.unwrap_or_default());
        }
        result.rows.push(row_data);
    }

    Ok(result)
}

async fn execute_oracle_query(config: &ConnectionConfig, query: &str) -> Result<SqlResult, String> {
    use oracle::{Connection, Connector, Error, Row};
    
    let connection_string = format!(
        "//{}:{}/{}",
        config.url,
        config.port.unwrap_or(1521),
        config.database.as_deref().unwrap_or("")
    );

    let username = config.user.clone().unwrap_or_default();
    let password = config.password.clone().unwrap_or_default();

    let conn = Connector::new(
        username.as_str(),
        password.as_str(),
        connection_string.as_str(),
    )
    .connect()
    .map_err(|e| e.to_string())?;

    let mut stmt = conn.statement(query).build().map_err(|e| e.to_string())?;
    let rows = stmt.query(&[]).map_err(|e| e.to_string())?;

    let mut result = SqlResult {
        columns: Vec::new(),
        rows: Vec::new(),
    };

    // Get column names
    let column_info = stmt.column_info();
    result.columns = column_info.iter().map(|col| col.name().to_string()).collect();

    // Get rows
    for row_result in rows {
        let row = row_result.map_err(|e| e.to_string())?;
        let mut row_data = Vec::new();
        
        for i in 0..column_info.len() {
            let value: String = row.get(i).unwrap_or_default();
            row_data.push(value);
        }
        
        result.rows.push(row_data);
    }

    Ok(result)
}