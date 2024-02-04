import { atom, useAtom } from "jotai";
import { nanoid } from "nanoid";

import { atomWithStore } from "jotai-zustand";
import { createStore } from "zustand/vanilla";

export const convertStringToFormula = (str: string) => {
  if (str.includes("{NUMBER}")) {
    return str.replace("{NUMBER}", "([0-9]+)");
  }
  return str;
};

type allStoredFormulas = {
  id: string;
  textFormula: string;
  value: string | string[];
};

export const formulaStore = createStore<allStoredFormulas[]>(() => []);
export const selectedFormulaIdStore = createStore<string | undefined>(
  () => undefined
);

export const formulaAtom = atomWithStore(formulaStore);
export const selectedFormulaIdAtom = atomWithStore<string | undefined>(
  selectedFormulaIdStore
);
