import { atom, useAtom } from "jotai";
import { nanoid } from "nanoid";

import { atomWithStore } from "jotai-zustand";
import { createStore } from "zustand/vanilla";

export const convertStringToFormula = (str: string) => {
  let fn = (str: string | string[]): number | string => {
    if (typeof str === "string") {
      return str;
    }
    return str.join(",");
  };
  let finalStr = str;

  try {
    if (finalStr.startsWith("SUM(")) {
      finalStr = finalStr.slice(0, 4);
      finalStr = finalStr.slice(0, -1);
      fn = (str) => {
        if (typeof str === "string") {
          return str
            .split(",")
            .map((s) => parseInt(s))
            .reduce((a, b) => a + b);
        } else {
          return str.map((s) => parseInt(s)).reduce((a, b) => a + b);
        }
      };
    }

    if (finalStr.includes("{NUMBER}")) {
      finalStr = finalStr.replace("{NUMBER}", "([0-9]+)");
    }
    if (finalStr.includes("{TEXT}")) {
      finalStr = finalStr.replace("{TEXT}", "([a-zA-Z]+)");
    }
    if (finalStr.includes("{DATE}")) {
      finalStr = finalStr.replace("{DATE}", "((?:[0-9]+(?:-|/)){2}[0-9]+)");
    }
    return { text: finalStr, fn };
  } catch {
    return { text: finalStr, fn };
  }
};

type allStoredFormulas = {
  id: string;
  textFormula: string;
  value: string | string[]; // which we find from the text
  result: string | string[] | number; // which we apply formula to
  isLocal: boolean;
};

export const formulaStore = createStore<allStoredFormulas[]>(() => []);
export const selectedFormulaIdStore = createStore<string | undefined>(
  () => undefined
);

export const formulaAtom = atomWithStore(formulaStore);
export const selectedFormulaIdAtom = atomWithStore<string | undefined>(
  selectedFormulaIdStore
);
