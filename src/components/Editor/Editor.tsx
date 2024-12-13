import "./editor.scss";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextStyle from "@tiptap/extension-text-style";
import { EditorProvider } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { editorKeys, editorStateAtom } from "../../state/editor";
import MathComponent from "../CustomRte/math.extension";
//@ts-ignore
import Document from "@tiptap/extension-document";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
//@ts-ignore
import UniqueId from "tiptap-unique-id";
import MenuBar from "./MenuBar";

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
