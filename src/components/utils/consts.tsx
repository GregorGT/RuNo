export const SITE_URL = "http://127.0.0.1:8000";
export const LICENSE_PATTERN = /^([A-Za-z0-9]{4})-([A-Za-z0-9]{4})-([A-Za-z0-9]{4})-([A-Za-z0-9]{4})$/;
export const HTTP_SUCCESS = 200;
export const TABLE_SIZE = {
  ALWAYS_UPDATE: 1,
  UPDATE_ONCE: 2,
  DO_NOTHING: 3
}

export const SQL_FORMULA_PATTERN = /^SQL\("([^"]+)",\s*"([^"]+)"\)$/;
export const SQL_CELL_PATTERN = /^SQL_Cell\((\d+),\s*(\d+)\)$/;