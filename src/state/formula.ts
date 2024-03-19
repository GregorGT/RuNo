import { atom } from "jotai";
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
    if (finalStr.startsWith("SUM(") && finalStr.endsWith(")")) {
      // sum we need to calculate the final value
      finalStr = finalStr.substring(4, finalStr.length - 1);
      fn = (str) => {
        try {
          if (typeof str === "string") {
            return str
              .split(",")
              .map((s) => parseInt(s))
              .reduce((a, b) => a + b);
          } else {
            return str.map((s) => parseInt(s)).reduce((a, b) => a + b, 0);
          }
        } catch (e) {
          console.error(e);
          return "Error";
        }
      };
    }

    /// Average
    if (finalStr.startsWith("AVG(") && finalStr.endsWith(")")) {
      // sum we need to calculate the final value
      finalStr = finalStr.substring(4, finalStr.length - 1);
      fn = (str) => {
        try {
          if (typeof str === "string") {
            return str
              .split(",")
              .map((s) => parseInt(s))
              .reduce((a, b) => a + b);
          } else {
            return (
              str.map((s) => parseInt(s)).reduce((a, b) => a + b, 0) /
              str.length
            );
          }
        } catch (e) {
          console.error(e);
          return "Error";
        }
      };
    }

    /// DIVIDE
    if (finalStr.startsWith("DIVIDE(") && finalStr.endsWith(")")) {
      // sum we need to calculate the final value
      finalStr = finalStr.substring(7, finalStr.length - 1);
      fn = (str) => {
        try {
          if (typeof str === "string") {
            return str
              .split(",")
              .map((s) => parseInt(s))
              .reduce((a, b) => a / b);
          } else {
            return str.map((s) => parseInt(s)).reduce((a, b) => a / b);
          }
        } catch (e) {
          console.error(e);
          return "Error";
        }
      };
    }

    /// MULTIPLY
    if (finalStr.startsWith("MUL(") && finalStr.endsWith(")")) {
      // sum we need to calculate the final value
      finalStr = finalStr.substring(9, finalStr.length - 1);
      fn = (str) => {
        try {
          if (typeof str === "string") {
            return str
              .split(",")
              .map((s) => parseInt(s))
              .reduce((a, b) => a * b);
          } else {
            return str.map((s) => parseInt(s)).reduce((a, b) => a * b);
          }
        } catch (e) {
          console.error(e);
          return "Error";
        }
      };
    }

    if (finalStr.startsWith("EVAL(")) {
      //We just need to remove eval
      finalStr = finalStr.substring(5, finalStr.length - 1);
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
  fn: (str: string | string[]) => number | string;
};

export const formulaStore = createStore<allStoredFormulas[]>(() => []);
export const selectedFormulaIdStore = createStore<string | undefined>(
  () => undefined
);

export const formulaAtom = atomWithStore(formulaStore);
export const selectedFormulaIdAtom = atomWithStore<string | undefined>(
  selectedFormulaIdStore
);
export const selectedFormulaTextAtom = atom<
  | undefined
  | {
      text: string;
      isLocal: boolean;
    }
>(undefined);
