import { atom } from "jotai";

export const editorKeys = {
  ENTRIES: "ENTRIES",
  VALUE_FORMULA: "VALUE_FORMULA",
  VALUE: "VALUE",
  HEADER: "HEADER",
};

export type exportDataFormatType = {
  ENTRIES: String;
  VALUE_FORMULA: String;
  VALUE: String;
  HEADER: String;
};

// Create your atoms and derivatives
export const editorStateAtom = atom<exportDataFormatType>({
  ENTRIES: "",
  VALUE_FORMULA: "",
  VALUE: "",
  HEADER: "",
});
