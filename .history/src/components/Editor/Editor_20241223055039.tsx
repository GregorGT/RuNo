import "./editor.scss";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextStyle from "@tiptap/extension-text-style";
import { EditorProvider, useEditor} from "@tiptap/react";
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { schema } from 'prosemirror-schema-basic'; 
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
    // Declare state for editorView
    const [editorView, setEditorView] = useState<EditorView | null>(null);

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
  const editorContainer = editorRef.current;

    // Use the useEditor hook to get the editor instance
    const editor = useEditor({
      extensions,
      content: defaultContent,
      autofocus: 'end',
      editable: true,
      editorProps: {
        handleScrollToSelection: (view) => {
          // You can use this function to control the scroll behavior when selection changes
          console.log('Editor is trying to scroll to the selection...');
          return true; // Returning true allows default scroll behavior, return false to disable it
        },
        attributes: {
          id: 'editor',
          style: `max-height:${height}px; overflow-y: scroll;`, // Apply scroll styles directly here
        },
      },
    });

  useEffect(() => {
    if (editor && editor.view) {
      const contentDOM = editor.view.dom.querySelector('.ProseMirror');

      if (contentDOM) {
        // Function to handle scroll event
        const handleScroll = (event: Event) => {
          const target = event.target as HTMLElement;

          if (target) {
            const scrollTop = target.scrollTop;
            const scrollHeight = target.scrollHeight;
            const clientHeight = target.clientHeight;

            // Example: Detect if scrolled to the bottom
            if (scrollTop + clientHeight >= scrollHeight) {
              console.log('Scrolled to the bottom');
            }

            // Example: Detect if scrolled to the top
            if (scrollTop === 0) {
              console.log('Scrolled to the top');
            }
          }
        };

        // Attach the scroll listener to ProseMirror content
        contentDOM.addEventListener('scroll', handleScroll);

        // Cleanup the listener on component unmount
        return () => {
          contentDOM.removeEventListener('scroll', handleScroll);
        };
      }
    }
  }, [editor]);

const handleScrollToSelection = (view: any) => {
  // Custom logic for handling scroll when selection is updated
  console.log('Handling scroll to selection...');
  console.log("view Object:", view)
  
  // Example: Implement custom scroll logic here
  const scrollContainer = editorRef.current;

  if (scrollContainer) {
    // You can use scrollContainer.scrollTop or other properties for custom scroll control
    scrollContainer.scrollTop = 100; // Example of custom scroll positioning
    const bottom = scrollContainer.scrollHeight === scrollContainer.scrollTop + scrollContainer.clientHeight;

    if (bottom) {
      console.log("Reached bottom");
      // Handle loading next chunk or logic
    } else {
      console.log("Scrolling up");
      // Handle scrolling up logic
    }
  
  }


  // Return true to indicate we have handled the scroll, preventing the default behavior
  return true; // Prevents further handling by ProseMirror
};


  const handleScroll = () => {
    console.log("Scroll event triggered");

    // Check if editorRef is available
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

  return (
    <div>
      {/* {showToolbar && <MenuBar editorName={editorName} />} */}
      <div
        ref={editorRef}
        className="editor-container"
        onScroll={handleScroll}
        style={{ height: "400px", overflowY: "auto" }}
      >
      <ErrorBoundary>
        <EditorProvider
          editorProps={
            {
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

    </div>
  );
}
