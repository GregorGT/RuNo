import { atom, useAtom } from "jotai";
import { nanoid } from "nanoid";

export const convertStringToFormula = (str: string) => {
  if (str.includes("{NUMBER}")) {
    return str.replace("{NUMBER}", "([0-9]+)");
  }
  return str;
};

export const formula = atom<string | undefined>(undefined);
export const value = atom<string | undefined>(undefined);
export const formulaId = atom<string | undefined>(undefined);
