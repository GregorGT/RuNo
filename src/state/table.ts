import { atomWithStore } from "jotai-zustand";
import { createStore } from "zustand/vanilla";
import { TABLE_SIZE } from "../components/utils/consts";

interface TableData {
  id: string;
  name?: string;
  sqlFormula?: string;
  tableSize?: TableSize;
  connection?: object,
}

interface SelectedTable {
  id: string;
  excelRef: string;
}

export const tableStore = createStore<TableData[]>(() => []);
export const selectedTableStore = createStore<SelectedTable>(() => ({
  id: "",
  excelRef: "",
}));

// export const tableStore = createStore<{ id: string; name: string }[]>(() => []);
// export const selectedTableStore = createStore<{ id: string; excelRef: string }>(() => ({
//   id: "",
//   excelRef: "",
// }));

export const tableAtom = atomWithStore(tableStore);
export const selectedTableAtom = atomWithStore(selectedTableStore);


export type TableSize = typeof TABLE_SIZE[keyof typeof TABLE_SIZE];