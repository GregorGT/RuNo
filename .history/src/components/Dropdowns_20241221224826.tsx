import {
  writeTextFile,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";
import type { MenuProps } from "antd";
import { Dropdown, notification } from "antd";
import { useAtom, useAtomValue } from "jotai/react";
import { editorStateAtom } from "../state/editor";
import { exportEditorFunction, loadEditorAtom } from "../state/load";
import { info } from "@tauri-apps/plugin-log";
import * as path from "@tauri-apps/api/path";
import { useState, useRef, useCallback } from "react";
import "./Components.scss";
import {
  filterFnAtom,
  formulaStore,
  isFilterEnable,
  isSortingEnable,
  selectedFormulaIdStore,
  sortingAtom,
  sortingFnAtom,
} from "../state/formula";

export default function Dropdowns() {
  const [editorState, setState] = useAtom(editorStateAtom);
  const [_, loadEditor] = useAtom(loadEditorAtom);
  const getEditorValue = useAtomValue(exportEditorFunction);
  const [filterValue, setFilterValue] = useAtom(filterFnAtom);
  const [sortingDirection, setSortingDirection] = useAtom(sortingAtom);
  const [sortingFn, setSortingFn] = useAtom(sortingFnAtom);
  const [filterEnabled, setFilterEnabled] = useAtom(isFilterEnable);
  const [sortingEnabled, setSortingEnabled] = useAtom(isSortingEnable);

  // New state for lazy loading
  const [editorChunks, setEditorChunks] = useState<string[]>([]); // Store chunks of data
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0); // Track the current chunk index
  const editorRef = useRef<HTMLDivElement | null>(null); // Reference to the editor container for scrolling

  const chunkSize = 5000; // Define how many characters per chunk

  const chunkEditorData = (data: string) => {
    const chunks = [];
    let i = 0;
    while (i < data.length) {
      chunks.push(data.substring(i, i + chunkSize));
      i += chunkSize;
    }
    return chunks;
  };

  const load_data = (json: string) => {
    try {
      const {
        editorData,
        filter,
        sorting,
        direction,
        isFilterEnable = false,
        isSortingEnable = false,
        formulas = [],
      } = JSON.parse(json);

      // Chunk the editor data
      const chunks = chunkEditorData(editorData);
      setEditorChunks(chunks);
      setCurrentChunkIndex(0); // Start with the first chunk

      // Set other states (filter, sorting, etc.)
      selectedFormulaIdStore.setState(undefined, true);
      setFilterValue(filter);
      setSortingFn(sorting);
      setSortingDirection(direction);
      setFilterEnabled(isFilterEnable);
      setSortingEnabled(isSortingEnable);
      formulaStore.setState(formulas, true);

      // Load the first chunk into the editor
      getEditorValue.load(chunks[0]);
    } catch (error) {
      showNotificaiton("Failed to load file. Please check the file format.");
      console.error("File loading error:", error);
    }
  };

  // Lazy loading logic on scroll
  const handleScroll = useCallback(() => {
    if (!editorRef.current) return;
    
    const bottom = editorRef.current.scrollHeight === editorRef.current.scrollTop + editorRef.current.clientHeight;
    if (bottom) {
      // User reached the bottom, load the next chunk
      if (currentChunkIndex < editorChunks.length - 1) {
        setCurrentChunkIndex((prev) => prev + 1);
        getEditorValue.load(editorChunks[currentChunkIndex + 1]);
      }
    } else {
      // User reached the top, load the previous chunk
      if (currentChunkIndex > 0) {
        setCurrentChunkIndex((prev) => prev - 1);
        getEditorValue.load(editorChunks[currentChunkIndex - 1]);
      }
    }
  }, [currentChunkIndex, editorChunks, getEditorValue]);

  const save_data = () => {
    const data = {
      editorData: getEditorValue.fn(),
      filter: filterValue,
      sorting: sortingFn,
      direction: sortingDirection,
      isFilterEnable: filterEnabled,
      isSortingEnable: sortingEnabled,
      formulas: formulaStore.getState(),
    };
    return data;
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
    { key: 3, label: "Text formatting" },
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
              const mypath = path.join(
                `${await downloadDir()}`,
                `export-${new Date().getTime()}.json`
              );
              await writeTextFile(await mypath, JSON.stringify(save_data()), {
                baseDir: BaseDirectory.AppConfig,
              });
              showNotificaiton(`File Saved as ${await mypath}`);
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
                reader.onload = (event) => {
                  const result = event.target?.result;
                  if (result) {
                    load_data(result as string);
                    showNotificaiton("File Loaded Successfully");
                  }
                };
                reader.onerror = (error) => {
                  showNotificaiton("File reading error");
                  console.error("File reading error:", error);
                };
                reader.readAsText(file);
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

      {/* Editor container with scroll listener */}
      <div
        ref={editorRef}
        className="editor-container"
        onScroll={handleScroll}
        style={{ height: "400px", overflowY: "auto" }}
      >
        {/* The editor content will be loaded dynamically */}
      </div>
    </div>
  );
}
