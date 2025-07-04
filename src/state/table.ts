import { atomWithStore } from "jotai-zustand";
import { createStore } from "zustand/vanilla";
import { TABLE_SIZE } from "../components/utils/consts";
import { Connection } from "./connection";

interface TableData {
  id: string;
  name?: string;
  sqlFormula?: string;
  tableSize?: TableSize;
  connection?: Connection,
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

export const tableAtom = atomWithStore(tableStore);
export const selectedTableAtom = atomWithStore(selectedTableStore);

export type TableSize = typeof TABLE_SIZE[keyof typeof TABLE_SIZE];