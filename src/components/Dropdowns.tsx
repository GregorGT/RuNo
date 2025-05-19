import { writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";
import type { MenuProps } from "antd";
import { Dropdown, notification } from "antd";
import { useAtom, useAtomValue } from "jotai/react";
// import { editorStateAtom } from "../state/editor";
import { exportEditorFunction } from "../state/load";
import * as path from "@tauri-apps/api/path";
import { selectedTableStore, tableAtom, tableStore } from "../state/table";
import { getExcelColumnName } from "../helper";

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
import ConnectionManagerDialog from "./DatabaseConnection/ConnectionManagerDialog";
import RegisterLicenseDialog from "./RegisterLicense/RegisterLicenseDialog";

import { useState } from "react";
import { connectionsStore } from "../state/connection";
import { RuNoFile } from "../state/fileTypes";

import { SITE_URL } from "./utils/consts";

const Dropdowns = () => {
  const tables = useAtomValue(tableAtom);
  // const [editorState, setState] = useAtom(editorStateAtom);
  // const [_, loadEditor] = useAtom(loadEditorAtom);
  const getEditorValue = useAtomValue(exportEditorFunction);
  const [filterValue, setFilterValue] = useAtom(filterFnAtom);
  const [sortingDirection, setSortingDirection] = useAtom(sortingAtom);
  const [sortingFn, setSortingFn] = useAtom(sortingFnAtom);
  const [filterEnabled, setFilterEnabled] = useAtom(isFilterEnable);
  const [sortingEnabled, setSortingEnabled] = useAtom(isSortingEnable);
  const [isConnectionDialogVisible, setConnectionDialogVisible] = useState(false);
  const [isRegisterLicenseDialogvisible, setRegisterLicenseDialogVisible] = useState(false);

  const save_data = (): RuNoFile => {
    return {
      editorData: getEditorValue.fn(),
      filter: filterValue,
      sorting: sortingFn,
      direction: sortingDirection,
      isFilterEnable: filterEnabled,
      isSortingEnable: sortingEnabled,
      formulas: formulaStore.getState(),
      tables: tables,
      sqlConnections: connectionsStore.getState().connections,
    };
  };
  const load_data = (json: string) => {
    const data: RuNoFile = JSON.parse(json);

    selectedFormulaIdStore.setState(undefined, true);
    getEditorValue.load(data.editorData);
    setFilterValue(data.filter);
    setSortingFn(data.sorting);
    setSortingDirection(data.direction ?? "asc");
    setFilterEnabled(data.isFilterEnable ?? false);
    setSortingEnabled(data.isSortingEnable ?? false);
    formulaStore.setState(data.formulas ?? [], true);
    tableStore.setState(data.tables ?? [], true);
    connectionsStore.setState(
      {
        connections: data.sqlConnections ?? [],
        selectedConnectionId: undefined,
      },
      true
    );
  };

  const fileItems: MenuProps["items"] = [
    { key: 1, label: "Load" },
    { key: 2, label: "Save" },
    { key: 3, label: "Exit" },
    { 
      key: 4, 
      label: "Export", 
      children: [
        {
          key: "export-rtf",
          label: "Export to RTF",
          onClick: () => {
            const htmlContent = getEditorValue.fn();
            // Import the exportToRTF function
            import("./utils/ExportUtils").then(async ({ exportToRTF }) => {
              try {
                // First ensure we get the latest HTML content with calculated formulas
                const success = await exportToRTF(htmlContent);
                if (success) {
                  api.success({
                    message: "RTF Export Successful",
                    description: "Document has been exported to RTF format",
                    placement: "topRight",
                  });
                }
              } catch (error) {
                console.error("Error during RTF export:", error);
                api.error({
                  message: "RTF Export Failed",
                  description: "There was an error exporting to RTF format",
                  placement: "topRight",
                });
              }
            }).catch(error => {
              console.error("Error importing RTF export function:", error);
              api.error({
                message: "RTF Export Failed",
                description: "Failed to load export functionality",
                placement: "topRight",
              });
            });
          }
        }
      ]
    },
    { key: 5, label: "Import" },
  ];
  const editItems: MenuProps["items"] = [
    { key: 1, label: "Copy" },
    { key: 2, label: "Paste" },
    { key: 3, label: "Text formatting" },
    {
      key: 4,
      label: "SQL Connections",
      onClick: () => setConnectionDialogVisible(true),
    },
  ];
  const infoItems: MenuProps["items"] = [
    { key: 1, label: "About" },
    { key: 2, label: "Donate" },
    { key: 3, label: "Contact" },
    {
      key: 4,
      label: "Purchase License",
      onClick: () => window.open(`${SITE_URL}/purchase`, '_blank')
    },
    {
      key: 5,
      label: "Register License",
      onClick: () => setRegisterLicenseDialogVisible(true)
    }
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
                reader.readAsText(file);
                reader.onload = () => {
                  load_data(reader.result as string);
                  const tables = document.getElementsByTagName("table");
                  Array.from(tables).forEach((table) => {
                    table.addEventListener("click", (e) => {
                      const cell = (e.target as HTMLElement)?.closest(
                        "td, th"
                      ) as HTMLTableCellElement | null;
                      if (!cell) return;

                      const row =
                        cell.parentElement as HTMLTableRowElement | null;
                      if (!row) return; // Add a check to ensure row is not null

                      const rowIndex = row.rowIndex + 1; // rowIndex is now safely accessible
                      const cellIndex = cell.cellIndex; // cellIndex is now safely accessible

                      const columnLetter = getExcelColumnName(cellIndex + 1);

                      const excelRef = `${columnLetter}${rowIndex}`;

                      selectedTableStore.setState({
                        id: table.id,
                        excelRef: excelRef,
                      });
                    });
                  });

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
      <Dropdown
        menu={{
          items: infoItems,
        }}
        placement="bottomLeft">
        <span>Info</span>
      </Dropdown>
      <RegisterLicenseDialog
        visible={isRegisterLicenseDialogvisible}
        onClose={() => setRegisterLicenseDialogVisible(false)}
      />
      <ConnectionManagerDialog
        visible={isConnectionDialogVisible}
        onClose={() => setConnectionDialogVisible(false)}
      />
    </div>
  );
}

export default Dropdowns