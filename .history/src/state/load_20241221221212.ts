import { atom } from "jotai";

export type loadExportDataFormatType = {
  ENTRIES: String;
  VALUE_FORMULA: String;
  VALUE: String;
  HEADER: String;
};

// Create your atoms and derivatives
export const loadEditorAtom = atom<loadExportDataFormatType>({
  ENTRIES: "",
  VALUE_FORMULA: "",
  VALUE: "",
  HEADER: "",
});

export const exportEditorFunction = atom<{
  fn: () => string;
  load: (data: string) => void;
}>({
  fn: () => {
    return "";
  },
  load: (data) => {},
});
