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
  Switch,
} from "antd";
import { useAtom, useAtomValue } from "jotai";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { editorKeys, editorStateAtom } from "../../state/editor";
import { formulaAtom, formulaStore } from "../../state/formula";
import { loadEditorAtom } from "../../state/load";
import MathComponent from "../CustomRte/math.extension";
import { tableAcions, textStyle } from "./const";
import { v4 } from "uuid";
import { invoke } from "@tauri-apps/api/tauri";

const MenuBar = ({ editorName }: { editorName: keyof typeof editorKeys }) => {
  const [loadEditor] = useAtom(loadEditorAtom);
  const { editor } = useCurrentEditor();
  const [allFormula, setFormulaValues] = useAtom(formulaAtom);

  useEffect(() => {
    if (loadEditor[editorName] && editor) {
      editor.commands.setContent(loadEditor[editorName], true);
    }
  }, [loadEditor]);
  if (!editor) {
    return null;
  }
  const [filteredEditorData, setFilteredEditorData] = useState<string>("");
  const [normailEditorData, setNormalEditorData] = useState<string>("");

  const load_data_to_backend = async () => {
    const return_data = (await invoke("run_command", {
      input: editor.getHTML(),
    })) as unknown;
    console.log(return_data);

    if (
      !return_data ||
      typeof return_data !== "object" ||
      !("formula_list" in return_data) ||
      !("parsed_text" in return_data) ||
      typeof return_data.parsed_text !== "string"
    )
      return;

    editor.commands.setContent(return_data.parsed_text, true);

    const formulas = return_data?.formula_list;
    if (Array.isArray(formulas)) {
      // ret?.map((item: any) => {
      //   if (item.id && item.data && document) {
      //     const element = document.getElementById(item.id);
      //     if (element) element.innerText = item.data;
      //   }
      // });
      const formula = formulaStore.getState();
      formulaStore.setState(
        [
          ...formula.map((item) => {
            const newItem = formulas.find((r: any) => r.id === item.id);
            if (newItem) {
              return {
                ...item,
                data: newItem.data,
              };
            }
            return item;
          }),
        ],
        true
      );

      // focus back to the editor
      editor.commands.focus();
    }
  };

  return (
    <div
      className="d-flex flex-col gap-2"
      style={{
        margin: "20px",
      }}
    >
      <Button onClick={load_data_to_backend}>Load Data</Button>
      <Switch onChange={(checked) => {}} />

      <Button
        onClick={async () => {
          const html2 = `<p>price dog 10</p><p>price dog 20</p><p></p><hr><p>ID: 1</p><p>price dog 10</p><p><formula id="e04b3496-dc9f-414c-b99f-8bd698aef573" formula="SUM(EVAL(&quot;ID: 1&quot;.&quot;price dog {NUMBER}&quot;))" value="" result="" data="10" data-type="math-component"></formula></p><p><formula id="d48956a1-c04e-42e0-8c52-0a974e1d1778" formula="MUL(EVAL(!&quot;price dog {NUMBER}&quot;),10)" value="" result="" data="100" data-type="math-component"></formula></p><p></p>`;
          const html = `<p>price dog 10</p><p><formula id="67c08692-b977-45b4-a1b0-ebf1a56efcf8" formula="SUM(1,3)" value="" result="" islocal="false" data-type="math-component"></formula></p>`;

          editor.commands.setContent(
            `<p>price dog 10</p><p>price dog 20</p><p></p><hr><p>ID: 1</p><p>price dog 10</p><p><formula id="e04b3496-dc9f-414c-b99f-8bd698aef573" formula="SUM(EVAL(&quot;ID: 1&quot;.&quot;price dog {NUMBER}&quot;))" value="" result="" data="10" data-type="math-component"></formula></p><p><formula id="d48956a1-c04e-42e0-8c52-0a974e1d1778" formula="MUL(EVAL(!&quot;price dog {NUMBER}&quot;),10)" value="" result="" data="100" data-type="math-component"></formula></p><p></p><p></p><hr><p>hisaujda</p><p>Dnkasjndkjsad</p>`,
            true
          );
        }}
      >
        Paste Data
      </Button>
      <Button
        onClick={async () => {
          console.log(editor.getHTML());
        }}
      >
        LOG
      </Button>
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

const extensions = [
  Color.configure({ types: [TextStyle.name] }),
  //@ts-ignore
  TextStyle.configure(),
  StarterKit.configure({
    bulletList: false,
    listItem: false,
    orderedList: false,
  }),
  Highlight.configure({ multicolor: true }),
  FontFamily,
  Table.configure({
    resizable: true,
  }),
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
  const [localEditorState, setLocalEditorState] = useState<string>();
  useEffect(() => {
    setEditorState({
      ...editorState,
      [editorName]: content,
    });
  }, []);
  const [allFormula, setFormulaValues] = useAtom(formulaAtom);

  return (
    <div>
      <EditorProvider
        onUpdate={({ editor }) => {
          setLocalEditorState(editor.getHTML());
          setEditorState((state) => {
            return { ...state, [editorName]: editor.getJSON() };
          });
        }}
        editorProps={{
          attributes: {
            id: "editor",
            style: `max-height:${height}px`,
          },
        }}
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
