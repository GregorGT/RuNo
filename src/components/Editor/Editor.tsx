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
import ListItem from "@tiptap/extension-list-item";
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
import { useEffect, useState } from "react";
import { editorKeys, editorStateAtom } from "../../state/editor";
import { loadEditorAtom } from "../../state/load";
import MathComponent from "../CustomRte/math.extension";
import SearchAndReplace from "../CustomRte/search";
import { tableAcions, textStyle } from "./const";
import { nanoid } from "nanoid";
import { useDebounce } from "react-use";
import { formulaAtom, selectedFormulaIdStore } from "../../state/formula";

const MenuBar = ({ editorName }: { editorName: keyof typeof editorKeys }) => {
  const [loadEditor] = useAtom(loadEditorAtom);
  const { editor } = useCurrentEditor();
  useEffect(() => {
    if (loadEditor[editorName] && editor) {
      editor.commands.setContent(loadEditor[editorName], true);
    }
  }, [loadEditor]);
  if (!editor) {
    return null;
  }

  return (
    <div
      className="d-flex flex-col gap-2"
      style={{
        margin: "20px",
      }}
    >
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
            editor
              .chain()
              .insertContent(
                {
                  type: "mathComponent",
                  attrs: {
                    id: nanoid(),
                    formula: "20*10",
                  },
                },
                {
                  parseOptions: {},
                }
              )
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
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  //@ts-ignore
  TextStyle.configure({ types: [ListItem.name] }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
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
  SearchAndReplace.configure({
    searchResultClass: "search-result",
    disableRegex: false,
  }),
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
  const allFormula = useAtomValue(formulaAtom);
  useDebounce(
    () => {
      const currentlySelctedId = selectedFormulaIdStore.getState();
      for (const formula of allFormula) {
        selectedFormulaIdStore.setState(formula.id);
        const editor = useCurrentEditor().editor;
      }

      //set all search query here to calculate outcome
    },
    1000,
    [localEditorState]
  );

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
            style: `max-height:${height}px`,
          },
        }}
        editable={true}
        children={<></>}
        slotBefore={showToolbar && <MenuBar editorName={editorName} />}
        extensions={extensions}
        content={editorState[editorName] || content}
        autofocus="end"
      />
    </div>
  );
}
