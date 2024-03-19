import { useState } from "react";
import { Resizable } from "react-resizable-element";
import "./Components.scss";
import Editor from "./Editor/Editor";

export default function Entries() {
  const [context, setContext] = useState(false);
  const [xyPosition, setxyPosition] = useState({ x: 0, y: 0 });

  const showNav = (event: any) => {
    event.preventDefault();
    setContext(false);
    const positionChange = {
      x: event.pageX,
      y: event.pageY,
    };
    setxyPosition(positionChange);
    setContext(true);
  };

  const hideContext = () => {
    setContext(false);
  };

  const [chosen, setChosen] = useState();
  const initMenu = (chosen: any) => {
    setChosen(chosen);
  };

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
