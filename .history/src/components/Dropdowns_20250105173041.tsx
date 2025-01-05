import { Menu, Dropdown, notification } from "antd";
import { MenuProps } from "antd/lib/menu";
import { useAtom, useAtomValue } from "jotai/react";
import { editorStateAtom } from "../state/editor";
import { exportEditorFunction, loadEditorAtom } from "../state/load";
import { writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import * as path from "@tauri-apps/api/path";
import { downloadDir } from "@tauri-apps/api/path";
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from "react";
import { filterFnAtom, sortingAtom, selectedFormulaIdStore, sortingFnAtom, isFilterEnable, isSortingEnable } from "../state/formula";
import { formulaStore } from "../state/formula";
import "./Components.scss";
import { useCurrentEditor } from "@tiptap/react";

const Dropdowns = React.forwardRef((props, ref) => {
  const [editorState, setState] = useAtom(editorStateAtom);
  const getEditorValue = useAtomValue(exportEditorFunction); // Access the editor's get and load functions
  const [filterValue, setFilterValue] = useAtom(filterFnAtom);
  const [sortingDirection, setSortingDirection] = useAtom(sortingAtom);
  const [sortingFn, setSortingFn] = useAtom(sortingFnAtom);
  const [filterEnabled, setFilterEnabled] = useAtom(isFilterEnable);
  const [sortingEnabled, setSortingEnabled] = useAtom(isSortingEnable);

  const [editorChunks, setEditorChunks] = useState<string[]>([]);  // State for the chunks
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0); // Current chunk index
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editor = useCurrentEditor();


  const chunkSize = 1000;
  const preloadChunks = 5; // Number of chunks to preload (before and after)

  // Function to break the editor data into chunks
  const chunkEditorData = (data: string) => {
    const chunks = [];
    let i = 0;
    while (i < data.length) {
      chunks.push(data.substring(i, i + chunkSize));
      i += chunkSize;
    }
    return chunks;
  };

  // Load data and break it into chunks
  const load_data = (json: string) => {
    try {
      const {
        editorData,
        filter,
        sorting,
        direction,
        isFilterEnable = false,
        isSortingEnable = false,
        formulas = [],
      } = JSON.parse(json);

      // Chunk the editor data
      const chunks = chunkEditorData(editorData);
      setEditorChunks(chunks); // Store chunks in state
      setCurrentChunkIndex(0);

      selectedFormulaIdStore.setState(undefined, true);
      setFilterValue(filter);
      setSortingFn(sorting);
      setSortingDirection(direction);
      setFilterEnabled(isFilterEnable);
      setSortingEnabled(isSortingEnable);
      formulaStore.setState(formulas, true);

      getEditorValue.load(chunks[0]);  // Load the first chunk into the editor
    } catch (error) {
      showNotificaiton("Failed to load file. Please check the file format.");
      console.error("File loading error:", error);
    }
  };

  //  // Use the ref and expose it using useImperativeHandle
  //  useImperativeHandle(ref, () => ({
  //   handleScroll() {
  //     if (editorRef.current) {
  //       const bottom = editorRef.current.scrollHeight === editorRef.current.scrollTop + editorRef.current.clientHeight;
  //       if (bottom) {
  //         console.log("Reached bottom");
  //         // Logic for bottom reached
  //       } else {
  //         console.log("Scrolling up");
  //         // Logic for scrolling up
  //       }
  //     }
  //   }
  // }));

  // Expose methods to the parent (Editor) via ref
  useImperativeHandle(ref, () => ({
    // You can expose functions to be accessed by the parent component
    handleScroll: () => {
      if (editorRef.current) {
        console.log("Scrolling triggered from parent");
        // Implement scroll logic here if needed
      }
    },
    // Define a function that accepts ref as a parameter
    handleEditorScroll: (editorRef: React.RefObject<HTMLDivElement>) => {  if (!editorRef.current) return;

      const scrollTop = editorRef.current.scrollTop;
      const scrollHeight = editorRef.current.scrollHeight;
      const clientHeight = editorRef.current.clientHeight;
    
      const totalHeight = scrollHeight - clientHeight; // Total scrollable height
      const scrollPercentage = scrollTop / totalHeight; // Percentage of scrolling position
    
      // Calculate the chunk to load based on scroll percentage
      const chunkToLoad = Math.floor(scrollPercentage * (editorChunks.length - 1));
    
      // Avoid loading the same chunk multiple times
      if (chunkToLoad !== currentChunkIndex) {
        // Calculate the range of chunks to preload
        const startIndex = Math.max(0, chunkToLoad - preloadChunks); // Ensure we don't go below index 0
        const endIndex = Math.min(editorChunks.length - 1, chunkToLoad + preloadChunks); // Ensure we don't go beyond the last chunk
    
        // Only load the chunks if we haven't already loaded them
        const visibleChunks = editorChunks.slice(startIndex, endIndex + 1);
        setCurrentChunkIndex(chunkToLoad);
    
        // Load the visible chunks into the editor
        getEditorValue.load(visibleChunks.join(''));
      }
    }}
  ));

   // Handle scroll to lazy load the next or previous chunks
  const handleScroll = () => {
    if (!editorRef.current) return;

    const scrollTop = editorRef.current.scrollTop;
    const scrollHeight = editorRef.current.scrollHeight;
    const clientHeight = editorRef.current.clientHeight;

    const totalHeight = scrollHeight - clientHeight; // Total scrollable height
    const scrollPercentage = scrollTop / totalHeight; // Percentage of scrolling position

    // Calculate the chunk based on scroll percentage
    const chunkToLoad = Math.floor(scrollPercentage * (editorChunks.length - 1));

    // Avoid loading the same chunk multiple times
    if (chunkToLoad !== currentChunkIndex) {
      const startIndex = Math.max(0, chunkToLoad - preloadChunks); // Preload chunks before the current chunk
      const endIndex = Math.min(editorChunks.length - 1, chunkToLoad + preloadChunks); // Preload chunks after the current chunk

      const visibleChunks = editorChunks.slice(startIndex, endIndex + 1);
      setCurrentChunkIndex(chunkToLoad);

      getEditorValue.load(visibleChunks.join(''));
    }
  };

  // Adjust scroller size based on content length
  const getScrollerSize = () => {
    const totalContentSize = editorChunks.length * chunkSize; // Calculate total content size
    const scrollHeight = totalContentSize + 200; // Adding some buffer
    return scrollHeight;
  };


    // Define a function that accepts ref as a parameter
    const handleEditorScroll = (editorRef: React.RefObject<HTMLDivElement>) => {
      if (editorRef.current) {
        const scrollPosition = editorRef.current.scrollTop;
        console.log("Editor Scroll Position:", scrollPosition);
        const bottom = editorRef.current.scrollHeight === editorRef.current.scrollTop + editorRef.current.clientHeight;

        // Check if we've scrolled to the bottom, then load more content
        if (bottom) {
          if (currentChunkIndex < editorChunks.length - 1) {
            setCurrentChunkIndex(prev => prev + 1);
            getEditorValue.load(editorChunks[currentChunkIndex + 1]);
          }
        } else {
          if (currentChunkIndex > 0) {
            setCurrentChunkIndex(prev => prev - 1);
            getEditorValue.load(editorChunks[currentChunkIndex - 1]);
          }
        }

        const currentChunkContent = getEditorValue.fn();
        if (currentChunkContent !== editorChunks[currentChunkIndex]) {
          const updatedChunks = [...editorChunks];
          updatedChunks[currentChunkIndex] = currentChunkContent;
          setEditorChunks(updatedChunks);
        }
      }
    };
  

  // Handle scroll to lazy load the next or previous chunks
  // const handleScroll = useCallback(() => {
  //   console.log("in scroller")
  //   if (!editorRef.current) return;
    
  //   const bottom = editorRef.current.scrollHeight === editorRef.current.scrollTop + editorRef.current.clientHeight;

  //   // Check if we've scrolled to the bottom, then load more content
  //   if (bottom) {
  //     if (currentChunkIndex < editorChunks.length - 1) {
  //       setCurrentChunkIndex(prev => prev + 1);
  //       getEditorValue.load(editorChunks[currentChunkIndex + 1]);
  //     }
  //   } else {
  //     if (currentChunkIndex > 0) {
  //       setCurrentChunkIndex(prev => prev - 1);
  //       getEditorValue.load(editorChunks[currentChunkIndex - 1]);
  //     }
  //   }

  //   const currentChunkContent = getEditorValue.fn();
  //   if (currentChunkContent !== editorChunks[currentChunkIndex]) {
  //     const updatedChunks = [...editorChunks];
  //     updatedChunks[currentChunkIndex] = currentChunkContent;
  //     setEditorChunks(updatedChunks);
  //   }

  //   // Manually trigger handleScrollToSelection when scroll happens
  //   if (editorRef.current && editorRef.current.scrollTop !== editorRef.current.scrollHeight) {
  //   }
  // }, [currentChunkIndex, editorChunks, getEditorValue]);

  // // Function to sync additional states when loading chunks
  // const updateAdditionalStates = () => {
  //   const loadData = useAtomValue(loadEditorAtom);  // Access loadEditorAtom state here
  
  //   // Now set the necessary states based on the loadData
  //   selectedFormulaIdStore.setState(undefined, true);  // Clear formula selection (if needed)
  //   setFilterValue(loadData.filter);
  //   setSortingFn(loadData.sorting);
  //   setSortingDirection(loadData.direction);
  //   setFilterEnabled(loadData.isFilterEnable);
  //   setSortingEnabled(loadData.isSortingEnable);
  //   formulaStore.setState(loadData.formulas, true);  // Set formulas
  // };
  
  
  // Save data with updated chunks
  const save_data = () => {
    // Ensure the current chunk is updated before saving
    const currentChunkContent = getEditorValue.fn();  // Get content of the current chunk
    if (currentChunkContent !== editorChunks[currentChunkIndex]) {
      const updatedChunks = [...editorChunks];
      updatedChunks[currentChunkIndex] = currentChunkContent;  // Update current chunk
      setEditorChunks(updatedChunks);  // Update the state
    }
  
    const data = {
      editorData: editorChunks.join(''),  // Join chunks into full content
      filter: filterValue,
      sorting: sortingFn,
      direction: sortingDirection,
      isFilterEnable: filterEnabled,
      isSortingEnable: sortingEnabled,
      formulas: formulaStore.getState(),
    };
  
    return data;
  };

  

  useEffect(() => {
    const editorContainer = editorRef.current;
    if (editorContainer) {
      const handleNativeScroll = () => {
        console.log("Native scroll triggered...");
        // handleScroll(); // Trigger the custom scroll handler
      };
      editorContainer.addEventListener("scroll", handleNativeScroll);
      return () => {
        editorContainer.removeEventListener("scroll", handleNativeScroll);
      };
    }
  }, [editorChunks, currentChunkIndex, getEditorValue]);
  // File menu items
  const fileItems: MenuProps["items"] = [
    {
      key: "1",
      label: "Load",
    },
    {
      key: "2",
      label: "Save",
    },
    {
      key: "3",
      label: "Exit",
    },
    {
      key: "4",
      label: "Export",
    },
    {
      key: "5",
      label: "Import",
    },
  ];

  const editItems: MenuProps["items"] = [
    {
      key: "1",
      label: "Copy",
    },
    {
      key: "2",
      label: "Paste",
    },
    {
      key: "3",
      label: "Text formatting",
    },
  ];

  const infoItems: MenuProps["items"] = [
    {
      key: "1",
      label: "About",
    },
    {
      key: "2",
      label: "Donate",
    },
    {
      key: "3",
      label: "Contact",
    },
  ];

  const [api, contextHolder] = notification.useNotification();
  const showNotificaiton = (message: string) => {
    api.info({
      message: message,
      placement: "topRight",
    });
  };

  return (
    <div className="dropdowns">
      {contextHolder}
      <Dropdown
        overlay={(
          <Menu
            items={fileItems}
            onClick={async (e) => {
              if (e.key === "2") {
                const mypath = path.join(
                  `${await downloadDir()}`,
                  `export-${new Date().getTime()}.json`
                );
                await writeTextFile(await mypath, JSON.stringify(save_data()), {
                  baseDir: BaseDirectory.AppConfig,
                });
                showNotificaiton(`File Saved as ${await mypath}`);
              }
              if (e.key === "1") {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  const file: File = (target.files as FileList)[0];
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result;
                    if (result) {
                      load_data(result as string);
                      showNotificaiton("File Loaded Successfully");
                    }
                  };
                  reader.onerror = (error) => {
                    showNotificaiton("File reading error");
                    console.error("File reading error:", error);
                  };
                  reader.readAsText(file);
                };
                input.click();
              }
            }}
          />
        )}
        trigger={['click']}
        placement="bottomLeft"
      >
        <span>File</span>
      </Dropdown>

      <Dropdown overlay={<Menu items={editItems} />} placement="bottomLeft">
        <span>Edit</span>
      </Dropdown>

      <Dropdown overlay={<Menu items={infoItems} />} placement="bottomLeft">
        <span>Info</span>
      </Dropdown>
    </div>
  );
});

export default Dropdowns;
