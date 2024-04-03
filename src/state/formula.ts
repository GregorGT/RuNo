import { atom } from "jotai";
import { atomWithStore } from "jotai-zustand";
import { createStore } from "zustand/vanilla";

type allStoredFormulas = {
  id: string;
  data: string;
  formula: string;
};

export const formulaStore = createStore<allStoredFormulas[]>(() => []);
export const selectedFormulaIdStore = createStore<string | undefined>(
  () => undefined
);

export const formulaAtom = atomWithStore(formulaStore);
export const selectedFormulaIdAtom = atomWithStore<string | undefined>(
  selectedFormulaIdStore
);

export const filterFnAtom = atom<string | undefined>(undefined);
export const sortingAtom = atom<"asc" | "desc">("asc");
export const sortingFnAtom = atom<string | undefined>(undefined);
