import { Resizable } from "react-resizable-element";
import "./Components.scss";
import Editor from "./Editor/Editor";

export default function Entries() {
  return (
        <Editor height={500} width={700} showToolbar editorName="ENTRIES" />
  );
}
