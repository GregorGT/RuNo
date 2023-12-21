import "./editor.scss";

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
  ColorPicker,
  Divider,
  Dropdown,
  Button as IconButton,
  Select,
  Space,
} from "antd";
import { Button } from "react-bootstrap";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UndoOutlined,
  RedoOutlined,
  TableOutlined,
  DownOutlined,
} from "@ant-design/icons";
const textStyle = [
  {
    value: "Paragraph",
    label: "Paragraph",
    isActive: (editor: any) => editor.isActive("paragraph"),
    onclick: (editor: any) => editor.chain().focus().toggleParagraph().run(),
  },
  {
    value: "heading 1",
    label: "heading 1",
    isActive: (editor: any) => editor.isActive("heading", { level: 1 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    value: "heading 2",
    label: "heading 2",
    isActive: (editor: any) => editor.isActive("heading", { level: 2 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    value: "heading 3",
    label: "heading 3",
    isActive: (editor: any) => editor.isActive("heading", { level: 3 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    value: "heading 4",
    label: "heading 4",
    isActive: (editor: any) => editor.isActive("heading", { level: 4 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    value: "heading 5",
    label: "heading 5",
    isActive: (editor: any) => editor.isActive("heading", { level: 5 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 5 }).run(),
  },
  {
    value: "heading 6",
    label: "heading 6",
    isActive: (editor: any) => editor.isActive("heading", { level: 6 }),
    onclick: (editor: any) =>
      editor.chain().focus().toggleHeading({ level: 6 }).run(),
  },
];

const tableAcions = [
  {
    label: "Add Row Below",
    value: "Add Row Below",
    onClick: (editor: any) => editor.chain().focus().addRowAfter().run(),
  },
  {
    label: "Add Column After",
    value: "Add Column After",
    onClick: (editor: any) => editor.chain().focus().addColumnAfter().run(),
  },
  {
    label: "Delete Row",
    value: "Delete Row",
    onClick: (editor: any) => editor.chain().focus().deleteRow().run(),
  },
  {
    label: "Delete Column",
    value: "Delete Column",
    onClick: (editor: any) => editor.chain().focus().deleteColumn().run(),
  },
  {
    label: "Delete Table",
    value: "Delete Table",
    onClick: (editor: any) => editor.chain().focus().deleteTable().run(),
  },
];

const MenuBar = () => {
  const { editor } = useCurrentEditor();
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
      <div className="d-flex gap-2">
        <Select
          onChange={(value) => {
            const style = textStyle.find((item) => item.value === value);
            if (style) {
              console.log(style);
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
      <div className="d-flex gap-2">
        <ColorPicker
          onChange={(color) => {
            editor.chain().focus().setColor(color.toHexString()).run();
          }}
          defaultValue={"#000"}
          value={editor.getAttributes("textStyle").color || "#000"}
          showText={() => <span>Text Color</span>}
        />

        <ColorPicker
          onChange={(color) => {
            editor
              .chain()
              .focus()
              .toggleHighlight({ color: color.toHexString() })
              .run();
          }}
          defaultValue={"#fff"}
          value={editor.getAttributes("highlight").color || "#fff"}
          showText={() => <span>Background Color</span>}
        />
      </div>

      <div className="d-flex gap-2">
        <IconButton
          icon={<TableOutlined size={14} />}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
              .run()
          }
        >
          insertTable
        </IconButton>
        <Select
          style={{ width: 300 }}
          onChange={(value) => {
            const action = tableAcions.find((item) => item.label === value);
            if (action) {
              action.onClick(editor);
            }
          }}
          value={"Table Actions"}
          defaultValue={"Table Actions"}
          options={tableAcions}
        >
          <Space>
            Table Actions
            <DownOutlined />
          </Space>
        </Select>
      </div>
    </div>
  );
};

const extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
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
];

const content = `

`;

export default () => {
  return (
    <EditorProvider
      slotBefore={<MenuBar />}
      extensions={extensions}
      content={content}
    />
  );
};
