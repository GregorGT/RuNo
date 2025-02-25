import { atomWithStore } from "jotai-zustand";
import { createStore } from "zustand/vanilla";

export const tableStore = createStore<{ id: string; name: string }[]>(() => []);
export const selectedTableStore = createStore<{ id: string; excelRef: string }>(() => ({
  id: "",
  excelRef: "",
}));

export const tableAtom = atomWithStore(tableStore);
export const selectedTableAtom = atomWithStore(selectedTableStore);
