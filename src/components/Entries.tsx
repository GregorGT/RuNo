import "./Components.scss";
import Editor from "./Editor";
import Boxes from "./box";

export default function Entries() {
  const boxes = [
    { name: "Marko", date: "07/11/2023" },
    { name: "James", date: "08/12/2023" },
    { name: "Kimura", date: "11/1/2023" },
    { name: "Ruby", date: "07/09/2022" },
    { name: "Potter", date: "07/09/2022" },
    { name: "Stanislau", date: "07/09/2022" },
    { name: "Ruby", date: "07/09/2022" },
    { name: "Ruby", date: "07/09/2022" },
  ];

  return (
    <div className="entries">
      <div className="entries-header">
        <input type="checkbox" />
        <span>ENTRIES</span>
        <button className="add-btn">Add an entry</button>
      </div>
      <div
        className="boxes"
        style={{
          width: "50vw",
        }}
      >
        <Editor />
      </div>
    </div>
  );
}
