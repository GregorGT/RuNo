import "./editor.scss";

import {
  BoldOutlined,
  CalculatorOutlined,
  HighlightOutlined,
  ItalicOutlined,
  RedoOutlined,
  TableOutlined,
  UnderlineOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/tauri";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextStyle from "@tiptap/extension-text-style";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Button,
  ColorPicker,
  Divider,
  Button as IconButton,
  Select,
} from "antd";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { v4 } from "uuid";
import { editorKeys, editorStateAtom } from "../../state/editor";
import {
  filterFnAtom,
  formulaStore,
  isFilterEnable,
  isSortingEnable,
  sortingAtom,
  sortingFnAtom,
} from "../../state/formula";
import { exportEditorFunction, loadEditorAtom } from "../../state/load";
import MathComponent from "../CustomRte/math.extension";
import { tableAcions, textStyle } from "./const";
//@ts-ignore
import Document from "@tiptap/extension-document";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
//@ts-ignore
import UniqueId from "tiptap-unique-id";
import { final_list } from "../../helper";
import { triggerFocus } from "antd/es/input/Input";

let example = final_list;
const MenuBar = ({ editorName }: { editorName: keyof typeof editorKeys }) => {
  const [loadEditor] = useAtom(loadEditorAtom);
  const { editor } = useCurrentEditor();
  // const [allFormula, setFormulaValues] = useAtom(formulaAtom);

  useEffect(() => {
    if (loadEditor[editorName] && editor) {
      editor.commands.setContent(loadEditor[editorName], true);
    }
  }, [loadEditor]);
  if (!editor) {
    return null;
  }
  // editor.on("transaction", ({ editor, transaction }) => {});

  // const [filteredEditorData, setFilteredEditorData] = useState<string>("");
  // const [normailEditorData, setNormalEditorData] = useState<string>("");
  const sortingDir = useAtomValue(sortingAtom);
  const sortingFn = useAtomValue(sortingFnAtom);
  const sortingEnabled = useAtomValue(isSortingEnable);
  const filterEnabled = useAtomValue(isFilterEnable);
  const filterFn = useAtomValue(filterFnAtom);
  const [_, setEditorExportFunction] = useAtom(exportEditorFunction);
  useEffect(() => {
    setEditorExportFunction({
      fn: () => editor.getHTML(),
      load: (data) => {
        invoke("clear_entry_id");
        editor.commands.setContent(data);
      },
    });
  }, [editor]);

  const load_data_to_backend = async () => {
    try {
      let top_id = "";
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "horizontalRule") {
          invoke("assign_entry_id", {
            entryId: node.attrs.id,
            topId: top_id,
          }).then(console.log);
          top_id = node.attrs.id;
          document
            .getElementById(node.attrs.id)
            ?.setAttribute("data-index", "1");
        }
      });

      ///
      console.log(editor.getHTML());
      console.log("loading data to backend");
      const return_data = (await invoke("run_command", {
        input: editor.getHTML(),
        sorting: sortingEnabled ? sortingFn : "",
        sortingUp: sortingDir === "asc",
        filter: filterEnabled ? filterFn : "",
      })) as unknown;

      //@ts-ignore
      if (typeof return_data?.is_error === "boolean" && return_data.is_error) {
        console.log("error", return_data);
        return;
      }
      if (
        !return_data ||
        typeof return_data !== "object" ||
        !("formula_list" in return_data) ||
        !("parsed_text" in return_data) ||
        typeof return_data.parsed_text !== "string" ||
        !("filtered" in return_data) ||
        !Array.isArray(return_data.filtered)
      ) {
        return;
      }
      console.log(return_data.parsed_text);
      editor.commands.setContent(return_data?.parsed_text, false);

      const formulas = return_data?.formula_list;

      if (Array.isArray(formulas)) {
        const formula = formulaStore.getState();

        const cssList = return_data.filtered;
        console.log(cssList);
        // css list contains ids to be hidden
        document.getElementById("editor_styles")!.innerHTML = cssList
          .map((id) => `[id="${id}"]{display: none;}`)
          .join("\n");

        formulaStore.setState(
          [
            ...formula.map((item) => {
              const newItem = formulas.find((r: any) => r.id === item.id);
              if (!newItem) {
                return item;
              }
              return {
                ...item,
                data: newItem.data,
              };
            }),
          ],
          true
        );

        // focus back to the editor
        editor.commands.focus();
      }
    } catch (e) {
      console.log(e);
    }
  };
  const [loadingData, setLoadingData] = useState(false);
  // On loading data true make the set command run

  const set_data = useCallback(() => {
    if (loadingData) {
      console.log("loading data");
      editor.commands.setContent(example, true);
    }
  }, [loadingData]);

  useEffect(() => {
    set_data();
  }, [loadingData]);

  return (
    <div
      className="d-flex flex-col gap-2"
      style={{
        margin: "20px",
      }}
    >
      <Button onClick={load_data_to_backend}>Load Data</Button>

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
            let id = v4();
            while (formulaStore.getState().find((f) => f.id === id)) {
              id = v4();
            }
            const currentData = formulaStore.getState();
            formulaStore.setState(
              [...currentData, { id, data: "", formula: "" }],
              true
            );
            editor
              .chain()
              .insertContent({
                type: "mathComponent",
                attrs: {
                  id,
                },
              })
              .run();
          }}
        />

        <Divider type="vertical" />

        <IconButton
          icon={<TableOutlined size={14} />}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
              .run()
          }
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
};

const CustomDocument = Document.extend({
  content: "horizontalRule block*",
});

const tableExtend = Table.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        class: "table-responsive",
        id: HTMLAttributes?.id ?? crypto.randomUUID(),
      },
      ["table", HTMLAttributes, ["tbody", 0]],
    ];
  },
});
const newHR = HorizontalRule.extend({
  addAttributes() {
    return {
      dataIndex: {
        default: -1,
        parseHTML: (element) => {
          console.log("Att", element.getAttribute("data-index"));
          return element.getAttribute("data-index");
        },

        // Take the attribute values
        renderHTML: (attributes) => {
          // … and return an object with HTML attributes.
          return {
            "data-index": attributes.dataIndex,
          };
        },
      },
    };
  },
});
const extensions = [
  newHR,
  UniqueId.configure({
    attributeName: "id",
    types: [
      "paragraph",
      "heading",
      "div",
      "orderedList",
      "bulletList",
      "listItem",
      "mathComponent",
      "table",
      "tableRow",
      "tableCell",
      "tableHeader",
      "horizontalRule",
      "bold",
      "italic",
      "underline",
      "textStyle",
      "highlight",
      "tableWrapper",
      "Table",
    ],
    createId: () => window.crypto.randomUUID(),
    filterTransaction: (transaction: any) =>
      !transaction.getMeta("preventUpdate"),
  }),
  CustomDocument,

  Color.configure({ types: [TextStyle.name] }),
  //@ts-ignore
  TextStyle.configure(),
  StarterKit.configure({
    bulletList: false,
    listItem: false,
    orderedList: false,
    document: false,
    horizontalRule: false,
  }),
  Highlight.configure({ multicolor: true }),
  FontFamily,
  tableExtend.configure({}),
  TableRow,
  TableHeader,
  TableCell,
  MathComponent,
];

const content = `
<p>price dog 10</p>
`;

export default function Editor({
  editorName,
  showToolbar,
  height,
}: {
  editorName: keyof typeof editorKeys;
  showToolbar: boolean;
  height: number;
}) {
  const [editorState, setEditorState] = useAtom(editorStateAtom);
  useEffect(() => {
    setEditorState({
      ...editorState,
      [editorName]: content,
    });
  }, []);

  return (
    <div>
      <EditorProvider
        // onUpdate={({ editor }) => {
        //   // setLocalEditorState(editor.getHTML());
        //   // setEditorState((state) => {
        //   //   return { ...state, [editorName]: editor.getJSON() };
        //   // });
        // }}
        editorProps={{
          attributes: {
            id: "editor",
            style: `max-height:${height}px`,
          },
        }}
        // onUpdate={({ transaction, editor }) => {
        //   let top_id = "";
        //   transaction.doc?.descendants((node, pos) => {
        //     if (node.type.name === "horizontalRule") {
        //       if (node.attrs.dataIndex === -1) {
        //         invoke("assign_entry_id", {
        //           entryId: node.attrs.id,
        //           topId: top_id,
        //         }).then(console.log);
        //         top_id = node.attrs.id;
        //       }
        //       document
        //         .getElementById(node.attrs.id)
        //         ?.setAttribute("data-index", "1");
        //     }
        //   });
        // }}
        editable={true}
        children={<></>}
        slotBefore={showToolbar && <MenuBar editorName={editorName} />}
        //@ts-ignore
        extensions={extensions}
        content={editorState[editorName] || content}
        autofocus="end"
      />
    </div>
  );
}
