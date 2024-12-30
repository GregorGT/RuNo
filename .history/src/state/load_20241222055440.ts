import { atom } from "jotai";

export type loadExportDataFormatType = {
  ENTRIES: String;
  VALUE_FORMULA: String;
  VALUE: String;
  HEADER: String;
  filter?: string;
  sorting?: string;
  direction?: string;
  isFilterEnable?: boolean;
  isSortingEnable?: boolean;
  formulas?: any[];  // Optional formulas field
};


// Create your atoms and derivatives
export const loadEditorAtom = atom<loadExportDataFormatType>({
  ENTRIES: "",
  VALUE_FORMULA: "",
  VALUE: "",
  HEADER: "",
});

// Create atoms for the editor state
export const exportEditorFunction = atom<{
  fn: () => string;  // Returns current content of the editor
  load: (data: string) => void;  // Loads content into the editor
}>({
  fn: () => {
    return currentEditorContent;  // Returns the current editor content
  },
  load: (data: string) => {
    currentEditorContent = data;  // Loads the new data into the editor
  },
});

let currentEditorContent = "";  // State to hold the current editor content

const setCurrentEditorContent = (data: string) => {
  currentEditorContent = data;  // Updates the current editor content
};