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

useEffect(() => {
  const handleScroll = () => {
    console.log("Scroll event triggered");

    // Check if editorRef is available
    const editorContainer = editorRef.current;
    if (!editorContainer) return;

    const bottom = editorContainer.scrollHeight === editorContainer.scrollTop + editorContainer.clientHeight;
    
    if (bottom) {
      console.log("Reached bottom");
      // Handle loading next chunk or logic
    } else {
      console.log("Scrolling up");
      // Handle scrolling up logic
    }
  };

  const editorContainer = editorRef.current;
  if (editorContainer) {
    // Attach the scroll event listener
    editorContainer.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      if (editorContainer) {
        editorContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }
}, []);

const handleScrollToSelection = (view: any) => {
  // Custom logic for handling scroll when selection is updated
  console.log('Handling scroll to selection...');
  console.log("view Object:", view)
  
  // Example: Implement custom scroll logic here
  const scrollContainer = editorRef.current;
  if (scrollContainer) {
    // You can use scrollContainer.scrollTop or other properties for custom scroll control
    scrollContainer.scrollTop = 100; // Example of custom scroll positioning
  }

  // Return true to indicate we have handled the scroll, preventing the default behavior
  return true; // Prevents further handling by ProseMirror
};

  return (
    <div>
      <ErrorBoundary>
        <EditorProvider
          editorProps={{
            handleScrollToSelection: handleScrollToSelection,
            attributes: {
              id: "editor",
              style: `max-height:${height}px; overflow-y: scroll;`,  // Apply scroll styles directly here
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
  );
}
