import { Resizable } from "react-resizable-element";
import "./Components.scss";
import Editor from "./Editor/Editor";

export default function Entries() {
  return (
    <Resizable direction="right" className="entries">
      <>
        <div className="entries-header">
          <input type="checkbox" />
          <span>ENTRIES</span>
          <button className="add-btn">Add an entry</button>
        </div>
        <Editor height={500} showToolbar editorName="ENTRIES" />
      </>
    </Resizable>
  );
}
