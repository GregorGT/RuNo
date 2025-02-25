import { useAtomValue, useAtom } from "jotai";
import { tableAtom, tableStore, selectedTableAtom, selectedTableStore } from "../../state/table";

const Table = () => {
  const [tables] = useAtom(tableAtom);
  const selectedTable = useAtomValue(selectedTableAtom);
  const { id, name = "" } = selectedTable ?? {};

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    
    selectedTableStore.setState((prev) => ({
      ...prev,
      name: newName,
    }));
    
    const updatedTables = tables.some((table) => table.id === id)
      ? tables.map((table) => (table.id === id ? { ...table, name: newName } : table))
      : [...tables, { id, name: newName }];
    
    tableStore.setState(updatedTables, true);
  };

  return (
    <div className="table-container">
      {id ? (
        <div className="table-details">
          <div className="d-flex justify-between">
            <p>Table</p>
          </div>
          <input
            type="text"
            className="p-1"
            value={name}
            onChange={handleNameChange}
            aria-label="Edit table name"
          />
        </div>
      ) : (
        <p>Please select a table to get started.</p>
      )}
    </div>
  );
};

export default Table;
