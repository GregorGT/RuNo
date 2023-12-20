import "./editor.scss";

import { Color } from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { Button } from "react-bootstrap";
import FontFamily from "@tiptap/extension-font-family";

import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";

import React from "react";

const MenuBar = () => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <div
      style={{
        margin: "20px",
      }}
    >
      <Button
        onClick={() =>
          editor
            .chain()
            .focus()
            .setFontFamily("Comic Sans MS, Comic Sans")
            .run()
        }
        className={
          editor.isActive("textStyle", {
            fontFamily: "Comic Sans MS, Comic Sans",
          })
            ? "is-active"
            : ""
        }
      >
        Comic Sans
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "is-active" : ""}
      >
        bold
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "is-active" : ""}
      >
        italic
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? "is-active" : ""}
      >
        strike
      </Button>
      <br />
      <Button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={editor.isActive("code") ? "is-active" : ""}
      >
        code
      </Button>
      <Button onClick={() => editor.chain().focus().unsetAllMarks().run()}>
        clear marks
      </Button>
      <Button onClick={() => editor.chain().focus().clearNodes().run()}>
        clear nodes
      </Button>
      <Button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={editor.isActive("paragraph") ? "is-active" : ""}
      >
        paragraph
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
      >
        h1
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
      >
        h2
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
      >
        h3
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        className={editor.isActive("heading", { level: 4 }) ? "is-active" : ""}
      >
        h4
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        className={editor.isActive("heading", { level: 5 }) ? "is-active" : ""}
      >
        h5
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
        className={editor.isActive("heading", { level: 6 }) ? "is-active" : ""}
      >
        h6
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "is-active" : ""}
      >
        bullet list
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "is-active" : ""}
      >
        ordered list
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive("codeBlock") ? "is-active" : ""}
      >
        code block
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? "is-active" : ""}
      >
        blockquote
      </Button>
      <Button onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        horizontal rule
      </Button>
      <Button onClick={() => editor.chain().focus().setHardBreak().run()}>
        hard break
      </Button>
      <Button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        undo
      </Button>
      <Button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        redo
      </Button>
      <Button
        onClick={() => editor.chain().focus().setColor("#958DF1").run()}
        className={
          editor.isActive("textStyle", { color: "#958DF1" }) ? "is-active" : ""
        }
      >
        purple
      </Button>
      <Button
        onClick={() =>
          editor.chain().focus().toggleHighlight({ color: "#ffc078" }).run()
        }
        className={
          editor.isActive("highlight", { color: "#ffc078" }) ? "is-active" : ""
        }
      >
        orange highlight
      </Button>
      <br />
      <Button
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
      >
        insertTable
      </Button>
      <Button onClick={() => editor.chain().focus().addColumnBefore().run()}>
        addColumnBefore
      </Button>
      <Button onClick={() => editor.chain().focus().addColumnAfter().run()}>
        addColumnAfter
      </Button>
      <Button onClick={() => editor.chain().focus().deleteColumn().run()}>
        deleteColumn
      </Button>
      <Button onClick={() => editor.chain().focus().addRowBefore().run()}>
        addRowBefore
      </Button>
      <Button onClick={() => editor.chain().focus().addRowAfter().run()}>
        addRowAfter
      </Button>
      <Button onClick={() => editor.chain().focus().deleteRow().run()}>
        deleteRow
      </Button>
      <Button onClick={() => editor.chain().focus().deleteTable().run()}>
        deleteTable
      </Button>
      <Button onClick={() => editor.chain().focus().mergeCells().run()}>
        mergeCells
      </Button>
      <Button onClick={() => editor.chain().focus().splitCell().run()}>
        splitCell
      </Button>
      <Button onClick={() => editor.chain().focus().toggleHeaderColumn().run()}>
        toggleHeaderColumn
      </Button>
      <Button onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
        toggleHeaderRow
      </Button>
      <Button onClick={() => editor.chain().focus().toggleHeaderCell().run()}>
        toggleHeaderCell
      </Button>
      <Button onClick={() => editor.chain().focus().mergeOrSplit().run()}>
        mergeOrSplit
      </Button>
      <Button
        onClick={() =>
          editor.chain().focus().setCellAttribute("colspan", 2).run()
        }
      >
        setCellAttribute
      </Button>
      <Button onClick={() => editor.chain().focus().fixTables().run()}>
        fixTables
      </Button>
      <Button onClick={() => editor.chain().focus().goToNextCell().run()}>
        goToNextCell
      </Button>
      <Button onClick={() => editor.chain().focus().goToPreviousCell().run()}>
        goToPreviousCell
      </Button>
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
  