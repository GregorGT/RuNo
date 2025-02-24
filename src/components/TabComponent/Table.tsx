import { useAtomValue } from "jotai";
import { selectedTableAtom, selectedTableStore } from "../../state/table";

const Table = () => {
  const selectedTable = useAtomValue(selectedTableAtom);
  const { id, name } = selectedTable ?? {}; // Destructure with a fallback

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    selectedTableStore.setState((prev) => ({
      ...prev,
      name: event.target.value
    }));
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
            value={name ?? ""}
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
