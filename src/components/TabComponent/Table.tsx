import { useAtomValue, useAtom } from "jotai";
import { tableAtom, tableStore, selectedTableAtom } from "../../state/table";
import { useEffect, useState } from "react";
import _ from "lodash";

const Table = () => {
  const [tables] = useAtom(tableAtom);
  const selectedTable = useAtomValue(selectedTableAtom);
  const { id, excelRef } = selectedTable ?? {};
  const [tableName, setTableName] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    const selectedTableData = tables.find((table) => table.id === id);
    if (selectedTableData) {
      setTableName(selectedTableData.name);
    } else {
      setTableName("");
    }
  }, [tables, id]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedName = event.target.value;
    setTableName(updatedName);

    const updatedTables = tables.some((table) => table.id === id)
      ? tables.map((table) =>
          table.id === id ? { ...table, name: updatedName } : table
        )
      : [...tables, { id, name: updatedName }];

    tableStore.setState(_.cloneDeep(updatedTables), true);
  };

  return (
    <div className="table-container">
      {id ? (
      <div className="filter-content">
        <div className="filters">
          <div className="flex-1">
            <label className="label">Table Name</label>
            <div className="flex items-center">
              <input
                value={tableName}
                onChange={handleNameChange}
                placeholder="Table Name"
                className="modified"
              />
            </div>
            <div>Selected Cell: { excelRef }</div>
          </div>
        </div>
      </div>
      ) : (
        <p>Please select a table to get started.</p>
      )}
    </div>
  );
};

export default Table;
