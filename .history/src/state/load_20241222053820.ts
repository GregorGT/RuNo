import { atom } from "jotai";

export type loadExportDataFormatType = {
  ENTRIES: string;
  VALUE_FORMULA: string;
  VALUE: string;
  HEADER: string;
};

// Create your atoms and derivatives
export const loadEditorAtom = atom<loadExportDataFormatType>({
  ENTRIES: "",
  VALUE_FORMULA: "",
  VALUE: "",
  HEADER: "",
});

export const exportEditorFunction = atom<{
  fn: () => string;  // This will return the current content of the chunk being edited
  load: (data: string) => void;  // This will set the content of the current chunk being edited
}>({
  fn: () => {
    // The fn method should return the current content of the editor.
    // Assuming you have an editor state where the content is being stored.
    // For instance, if the content is in a ref or state, return it here.
    return currentEditorContent;  // `currentEditorContent` is the content being edited
  },
  load: (data) => {
    // This will load the content into the editor
    setCurrentEditorContent(data);  // Update the content of the editor with the new data
  },
});

// Assuming `currentEditorContent` is a state holding the content of the current chunk being edited
let currentEditorContent = "";

const setCurrentEditorContent = (data: string) => {
  currentEditorContent = data;  // This function updates the current chunk's content
};
