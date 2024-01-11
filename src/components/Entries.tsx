import { useState } from "react";
import { Resizable } from "react-resizable-element";
import "./Components.scss";
import Editor from "./Editor";

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
        {/* <div
          className="contextContainer"
          onContextMenu={(e) => showNav(e)}
          onClick={() => hideContext()}
        >
          {chosen && <h4>{chosen}</h4>}
          {context && (
            <div
              style={{ top: xyPosition.y, left: xyPosition.x }}
              className="rightClick"
            >
              <div
                className="menuElement"
                onClick={() => initMenu("Export table to CVS")}
              >
                Export table to CVS
              </div>
              <div
                className="menuElement"
                onClick={() => initMenu("Import CVS to table")}
              >
                Import CVS to table
              </div>
            </div>
          )}
        </div> */}
        <Editor height={500} showToolbar editorName="ENTRIES" />
      </>
    </Resizable>
  );
}
