import { useEffect, useState, memo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useCurrentEditor } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import {
  filterFnAtom,
  formulaStore,
  isFilterEnable,
  isSortingEnable,
  sortingAtom,
  sortingFnAtom,
} from "../../state/formula";
import { editorKeys } from "../../state/editor";
import { tableAcions, textStyle } from "./const";
import { v4 } from "uuid";
import {
  Button,
  Divider,
  Select,
  Button as IconButton,
  ColorPicker,
  message,
} from "antd";
import {
  BoldOutlined,
  CalculatorOutlined,
  ExportOutlined,
  HighlightOutlined,
  ItalicOutlined,
  RedoOutlined,
  TableOutlined,
  UnderlineOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { exportEditorFunction, loadEditorAtom } from "../../state/load";
import { selectedTableStore } from "../../state/table";
import { final_list } from "../../helper";
import { InvokeArgs, invoke } from "@tauri-apps/api/core";
import { getExcelColumnName } from "../../helper";

interface BackendResponse {
  is_error?: boolean;
  formula_list?: Array<{ id: string; data: any }>;
  parsed_text?: string;
  filtered?: string[];
}

interface FormulaItem {
  id: string;
  data: string;
  formula: string;
}

interface MenuBarProps {
  editorName: keyof typeof editorKeys;
}

interface EditorExportFunction {
  fn: () => string;
  load: (data: string) => Promise<void>;
}

async function safeInvoke<T = any>(
  method: string,
  params?: InvokeArgs
): Promise<T | null> {
  if (typeof invoke !== "function") {
    console.error("Invoke method is not available");
    return null;
  }

  try {
    return await invoke(method, params);
  } catch (error) {
    console.error(`Error invoking ${method}:`, error);
    message.error(`Backend operation failed: ${String(error)}`);
    return null;
  }
}
// Utility Functions
const processBackendData = (
  editor: Editor,
  response: BackendResponse | null
): void => {
  if (!response || response.is_error) {
    console.error("Backend processing error:", response);
    message.error("Failed to process backend data");
    return;
  }

  const { formula_list, filtered } = response;

  if (filtered && formula_list) {
    try {
      const styleElement = document.getElementById("editor_styles");
      if (styleElement) {
        styleElement.innerHTML = filtered
          .map((id) => `[id="${id}"]{display: none;}`)
          .join("\n");
      }
      const currentFormulas = formulaStore.getState();
      const updatedFormulas = currentFormulas.map((item) => {
        const newItem = formula_list.find((r) => r.id === item.id);
        return newItem ? { ...item, data: newItem.data } : item;
      });

      formulaStore.setState(updatedFormulas, true);
      editor.commands.focus();
    } catch (error) {
      console.error("Error processing backend data:", error);
      message.error("Error updating editor state");
    }
  }
};

const generateUniqueFormulaId = (existingFormulas: FormulaItem[]): string => {
  let id = v4();
  while (existingFormulas.some((f) => f.id === id)) {
    id = v4();
  }
  return id;
};

const MenuBar = memo(({ editorName }: MenuBarProps) => {
  const [loadEditor] = useAtom(loadEditorAtom);
  const { editor } = useCurrentEditor();
  const [loadingData, setLoadingData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortingDir = useAtomValue(sortingAtom);
  const sortingFn = useAtomValue(sortingFnAtom);
  const sortingEnabled = useAtomValue(isSortingEnable);
  const filterEnabled = useAtomValue(isFilterEnable);
  const filterFn = useAtomValue(filterFnAtom);
  const [_, setEditorExportFunction] = useAtom(exportEditorFunction);

  const editorConfig = {
    sortingConfig: {
      enabled: sortingEnabled,
      fn: sortingFn,
      direction: sortingDir,
    },
    filterConfig: {
      enabled: filterEnabled,
      fn: filterFn,
    },
  };

  const defaultExportFunction: EditorExportFunction = {
    fn: () => "",
    load: async () => {},
  };

  useEffect(() => {
    if (!editor) return;

    const exportFunction: EditorExportFunction = {
      fn: () => editor.getHTML(),
      load: async (data: string) => {
        try {
          // if (window.__TAURI__ && typeof invoke === "function") {
            await invoke("clear_entry_id");
          // }
          editor.commands.setContent(data);
        } catch (error) {
          console.error("Error in load function:", error);
        }
      },
    };

    setEditorExportFunction(exportFunction);

    return () => {
      setEditorExportFunction(defaultExportFunction);
    };
  }, [editor, setEditorExportFunction]);

  useEffect(() => {
    if (!loadEditor[editorName] && !editor) return;

    const originalContent = editor?.getHTML();

    if (loadEditor[editorName] && editor) {
      editor.commands.setContent(loadEditor[editorName], true);
    }

    return () => {
      if (editor && originalContent) {
        editor.commands.setContent(originalContent, true);
      }
    };
  }, [loadEditor, editorName, editor]);

  const loadDataToBackend = async () => {
    if (!editor) return;

    setLoading(true);
    setError(null);

    try {
      // Ensure editor content is loaded before invoking
      console.log("editor.state.doc.text.length", editor);
      if (editor?.isEmpty) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      let topId = "";
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "horizontalRule") {
          safeInvoke("assign_entry_id", {
            entryId: node.attrs.id,
            topId: topId,
          }).then(console.log);

          topId = node.attrs.id;
          document
            .getElementById(node.attrs.id)
            ?.setAttribute("data-index", "1");
        }
      });

      const returnData = (await invoke("run_command", {
        input: editor.getHTML(),
        sorting: editorConfig.sortingConfig.enabled
          ? editorConfig.sortingConfig.fn
          : "",
        sortingUp: editorConfig.sortingConfig.direction === "asc",
        filter: editorConfig.filterConfig.enabled
          ? editorConfig.filterConfig.fn
          : "",
      })) as BackendResponse;

      processBackendData(editor, returnData);
    } catch (e) {
      console.error("Backend loading error:", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingData || !editor) return;

    const loadContent = async () => {
      try {
        editor.commands.setContent(final_list, true);
      } finally {
        setLoadingData(false);
      }
    };

    // Track if component is mounted
    let isMounted = true;

    loadContent();

    return () => {
      isMounted = false;
      setLoadingData(false);
    };
  }, [loadingData, editor]);

  // Prevent render if no editor
  if (!editor) return null;

  return (
    <div className="d-flex flex-col gap-2" style={{ margin: "20px" }}>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div className="d-flex gap-2">
        <Button onClick={loadDataToBackend} loading={loading} disabled={loading}>
          Update
        </Button>
        <Button 
          icon={<ExportOutlined />}
          onClick={async () => {
            try {
              // First ensure all formulas are calculated
              await loadDataToBackend();
              
              // Import the exportToRTF function
              import("../utils/ExportUtils").then(async ({ exportToRTF }) => {
                try {
                  const htmlContent = editor.getHTML();
                  const success = await exportToRTF(htmlContent);
                  if (success) {
                    message.success("Successfully exported to RTF");
                  }
                } catch (err) {
                  console.error("Error exporting to RTF:", err);
                }
              }).catch(err => {
                console.error("Error importing exportToRTF:", err);
                message.error("Error importing RTF export function");
              });
            } catch (error) {
              console.error("Error calculating formulas before export:", error);
              message.error("Error calculating formulas before export");
            }
          }}
        >
          Export to RTF
        </Button>
      </div>
      <div className="d-flex gap-2  ">
        <Select
          style={{ fontSize: 10 }}
          onChange={(value) => {
            const style = textStyle.find((item) => item.value === value);
            if (style) {
              style.onclick(editor);
            }
          }}
          value={textStyle.find((item) => item.isActive(editor))?.value}
          options={textStyle}
        />
        <Divider type="vertical" />

        <IconButton
          type={editor.isActive("bold") ? "primary" : "default"}
          shape="circle"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          icon={<BoldOutlined size={14} />}
        />

        <IconButton
          type={editor.isActive("italic") ? "primary" : "default"}
          shape="circle"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          icon={<ItalicOutlined size={14} />}
        />
        <IconButton
          type={editor.isActive("underline") ? "primary" : "default"}
          shape="circle"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          icon={<UnderlineOutlined size={14} />}
        />

        <Divider type="vertical" />

        <ColorPicker
          onChangeComplete={(color) => {
            editor.chain().focus().setColor(color.toHexString()).run();
          }}
          defaultValue={"#000"}
          value={editor.getAttributes("textStyle").color || "#000"}
          showText={() => <span>Text Color</span>}
          placement="top"
          size="small"
        >
          <Button
            color={editor.getAttributes("textStyle").color || "#000"}
            style={{
              cursor: "pointer",
              fontWeight: 600,
              padding: 0,
              width: 30,
              height: 30,
            }}
          >
            A
          </Button>
        </ColorPicker>

        <ColorPicker
          onChangeComplete={(color) => {
            editor
              .chain()
              .focus()
              .toggleHighlight({ color: color.toHexString() })
              .run();
          }}
          defaultValue={"#fff"}
          value={editor.getAttributes("highlight").color || "#fff"}
          showText={() => <span>Background Color</span>}
        >
          <IconButton
            style={{
              backgroundColor:
                editor.getAttributes("highlight").color || "#fff",
            }}
            icon={<HighlightOutlined size={14} />}
          ></IconButton>
        </ColorPicker>

        <Divider type="vertical" />
        <IconButton
          icon={<CalculatorOutlined />}
          onClick={() => {
            const currentFormulas = formulaStore.getState();
            const id = generateUniqueFormulaId(currentFormulas);

            formulaStore.setState(
              [...currentFormulas, { id, data: "", formula: "" }],
              true
            );

            editor
              .chain()
              .insertContent({
                type: "mathComponent",
                attrs: { id },
              })
              .run();
          }}
        />

        <Divider type="vertical" />

        <IconButton
          icon={<TableOutlined size={14} />}
          onClick={() => {
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
              .run()
            
            const tables = document.getElementsByTagName("table");

            Array.from(tables).forEach((table) => {
              table.addEventListener("click", (e) => {
                const cell = e.target?.closest("td, th");
                if (!cell) return;
            
                const row = cell.parentElement;
                const rowIndex = row.rowIndex + 1;
                const cellIndex = cell.cellIndex;
            
                const columnLetter = getExcelColumnName(cellIndex + 1);
            
                const excelRef = `${columnLetter}${rowIndex}`;
            
                selectedTableStore.setState({
                  id: table.id,
                  excelRef: excelRef
                });
              });
            });
          }}
        ></IconButton>
        <Select
          popupMatchSelectWidth={false}
          onChange={(value) => {
            const action = tableAcions.find((item) => item.label === value);
            if (action) {
              action.onClick(editor);
            }
          }}
          value={""}
          defaultValue={""}
          options={tableAcions}
        ></Select>
        <Divider type="vertical" />
        <IconButton
          icon={<UndoOutlined size={14} />}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        />
        <IconButton
          icon={<RedoOutlined size={14} />}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        />
      </div>
    </div>
  );
});

export default MenuBar;
