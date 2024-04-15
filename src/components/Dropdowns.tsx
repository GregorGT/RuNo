import { writeTextFile } from "@tauri-apps/api/fs";
import { downloadDir } from "@tauri-apps/api/path";
import type { MenuProps } from "antd";
import { Dropdown, notification } from "antd";
import { useAtom, useAtomValue } from "jotai/react";
import { editorStateAtom } from "../state/editor";
import { exportEditorFunction, loadEditorAtom } from "../state/load";
import "./Components.scss";
import { filterFnAtom, sortingAtom, sortingFnAtom } from "../state/formula";

export default function Dropdowns() {
  const [editorState, setState] = useAtom(editorStateAtom);
  const [_, loadEditor] = useAtom(loadEditorAtom);
  const getEditorValue = useAtomValue(exportEditorFunction);
  const [filterValue, setFilterValue] = useAtom(filterFnAtom);
  const [sortingDirection, setSortingDirection] = useAtom(sortingAtom);
  const [sortingFn, setSortingFn] = useAtom(sortingFnAtom);

  const save_data = () => {
    const data = {
      editorData: getEditorValue.fn(),
      filter: filterValue,
      sorting: sortingFn,
      direction: sortingDirection,
    };
    return data;
  };
  const load_data = (json: string) => {
    console.log(json);
    const { editorData, filter, sorting, direction } = JSON.parse(json);
    getEditorValue.load(editorData);
    setFilterValue(filter);
    setSortingFn(sorting);
    setSortingDirection(direction);
  };

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
              console.log(getEditorValue.fn());
              const path = `${await downloadDir()}export-${new Date().getTime()}.json`;
              await writeTextFile({
                path,
                contents: JSON.stringify(save_data()),
              });
              showNotificaiton(`File Saved as ${path}`);
            }
            if (e.key === "1") {
              // Open File Picker
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                const file: File = (target.files as FileList)[0];
                console.log(file);
                const reader = new FileReader();
                reader.readAsText(file);
                reader.onload = () => {
                  load_data(reader.result as string);
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
