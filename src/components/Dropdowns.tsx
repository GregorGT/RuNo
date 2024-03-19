import { writeTextFile } from "@tauri-apps/api/fs";
import { downloadDir } from "@tauri-apps/api/path";
import type { MenuProps } from "antd";
import { Dropdown, notification } from "antd";
import { useAtom } from "jotai/react";
import { editorStateAtom } from "../state/editor";
import { loadEditorAtom } from "../state/load";
import "./Components.scss";

export default function Dropdowns() {
  const [editorState, setState] = useAtom(editorStateAtom);
  const [_, loadEditor] = useAtom(loadEditorAtom);

  const fileItems: MenuProps["items"] = [
    { key: 1, label: "Load" },
    { key: 2, label: "Save" },
    { key: 3, label: "Exit" },
    { key: 4, label: "Export" },
    { key: 5, label: "Import" },
  ];
  const editItems: MenuProps["items"] = [
    { key: 1, label: "Copy" },
    { key: 2, label: "Paste" },
    { key: 3, label: "Text foratting" },
  ];
  const infoItems: MenuProps["items"] = [
    { key: 1, label: "About" },
    { key: 2, label: "Donate" },
    { key: 3, label: "Contact" },
  ];

  const [api, contextHolder] = notification.useNotification();
  const showNotificaiton = (message: string) => {
    api.info({
      message: message,
      placement: "topRight",
    });
  };

  return (
    <div className="dropdowns">
      {contextHolder}
      <Dropdown
        menu={{
          items: fileItems,
          onClick: async (e) => {
            if (e.key === "2") {
              await writeTextFile({
                path: `${await downloadDir()}/export-${new Date().getTime()}.json`,
                contents: JSON.stringify(editorState),
              });
              showNotificaiton("File Saved");
            }
            if (e.key === "1") {
              // Open File Picker
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                const file: File = (target.files as FileList)[0];
                const reader = new FileReader();
                reader.readAsText(file);
                reader.onload = () => {
                  loadEditor(JSON.parse(reader.result as string));
                  setState(JSON.parse(reader.result as string));
                  showNotificaiton("File Loaded");
                };
              };
              input.click();
            }
          },
        }}
        placement="bottomLeft"
      >
        <span>File</span>
      </Dropdown>
      <Dropdown menu={{ items: editItems }} placement="bottomLeft">
        <span>Edit</span>
      </Dropdown>
      <Dropdown menu={{ items: infoItems }} placement="bottomLeft">
        <span>Info</span>
      </Dropdown>
    </div>
  );
}
