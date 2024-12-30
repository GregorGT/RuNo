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
import React, {useRef, useEffect, useState, ReactNode } from "react";
import { editorKeys, editorStateAtom } from "../../state/editor";
import MathComponent from "../CustomRte/math.extension";
//@ts-ignore
import Document from "@tiptap/extension-document";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
//@ts-ignore
import UniqueId from "tiptap-unique-id";
import MenuBar from "./MenuBar";
import Dropdowns from "../Dropdowns";
import { Resizable } from "react-resizable-element";
import TabComponent from "../TabComponent";

const CustomDocument = Document.extend({
  content: "horizontalRule block*",
});

let idCounter = 0;
const createId = () => `id-${idCounter++}`;

const CustomTable = Table.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        class: "table-responsive",
        id: HTMLAttributes?.id ?? `table-${createId()}`,
      },
      ["table", HTMLAttributes, ["tbody", 0]],
    ];
  },
});

const CustomHorizontalRule = HorizontalRule.extend({
  addAttributes() {
    return {
      dataIndex: {
        default: -1,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-index"),
        renderHTML: (attributes: { dataIndex: number }) => ({
          "data-index": attributes.dataIndex,
        }),
      },
    };
  },
});

const extensions = [
  CustomHorizontalRule,
  UniqueId.configure({
    attributeName: "id",
    types: ["heading", "table", "horizontalRule"],
    createId,
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
  CustomTable.configure({}),
  TableRow,
  TableHeader,
  TableCell,
  MathComponent,
];

interface ErrorBoundaryProps {
  children: ReactNode;
}

const ErrorBoundary = ({ children }: ErrorBoundaryProps) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [children]);

  if (hasError) {
    return <div>Error loading editor content.</div>;
  }
  return <React.Fragment>{children}</React.Fragment>;
};

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
  const [defaultContent, setDefaultContent] = useState("");
  

  // Fetch default content
  useEffect(() => {
    const fetchDefaultContent = async () => {
      try {
        const response = await fetch("/api/default-content");
        const content = await response.text();
        setDefaultContent(content);
      } catch (error) {
        console.error("Error fetching default content:", error);
        setDefaultContent("<p>Default content unavailable.</p>");
      }
    };
    fetchDefaultContent();
  }, []);

  useEffect(() => {
    setEditorState({
      ...editorState,
      [editorName]: editorState[editorName] || defaultContent,
    });
  }, [defaultContent]);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<any>(null);
  const [editorHeight, setEditorHeight] = useState<number>(0); // State for editor height

// Function to update editor height dynamically based on screen size
const updateEditorHeight = () => {
  if (editorRef.current) {
    const windowHeight = window.innerHeight;
    const toolbarHeight = showToolbar ? 100 : 0; // Adjust the value based on your toolbar height
    const calculatedHeight = windowHeight - toolbarHeight - 100; // Subtract 100px for padding/margin or any other elements
    setEditorHeight(calculatedHeight);
  }
};

// Add resize event listener
useEffect(() => {
  updateEditorHeight(); // Initial height calculation
  window.addEventListener("resize", updateEditorHeight); // Update height on window resize

  // Cleanup on unmount
  return () => {
    window.removeEventListener("resize", updateEditorHeight);
  };
}, [showToolbar]);

// Scroll handler
useEffect(() => {
  const handleScroll = () => {
    console.debug("Scroll event triggered");

    if (dropdownRef.current) {
      console.debug("debug Scroll event triggered");
      dropdownRef.current.handleEditorScroll(editorRef);
    }
  };

  const editorContainer = editorRef.current;
  if (editorContainer) {
    editorContainer.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      if (editorContainer) {
        editorContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }
}, []);


  return (
    <div className="home" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
    <div>
      <Dropdowns ref={dropdownRef} />
    </div>
    <div 
      className="content">
    <Resizable direction="right" className="entries">
      <div   
            ref={editorRef}  // Bind the ref to the editor container
            style={{
              flex: 1,  // Make editor take remaining space in the column
              overflowY: "scroll", 
              height: "100%", // Enable scroll if content exceeds
              maxHeight: "calc(100vh - 100px)"  // Adjust this based on your layout
            }}>
      <ErrorBoundary>
        <EditorProvider
          editorProps={{
            attributes: {
              id: "editor",
              style: `max-height:4800px`,
            },
          }}
          editable={true}
          children={<></>}
          slotBefore={showToolbar && <MenuBar editorName={editorName} />}
          //@ts-ignore
          extensions={extensions}
          content={editorState[editorName] || defaultContent}
          autofocus="end"
        />          
      </ErrorBoundary>
      </div>
      </Resizable>
      <TabComponent />
      <style id="editor_styles"></style>
      </div>
    </div>
  );
}
