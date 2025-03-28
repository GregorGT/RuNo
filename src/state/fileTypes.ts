// fileTypes.ts
import type { Connection } from "../state/connection";
import type { allStoredFormulas } from "../state/formula";

export interface RuNoFile {
  editorData: string;
  filter?: string;
  sorting?: string;
  direction?: "asc" | "desc";
  isFilterEnable?: boolean;
  isSortingEnable?: boolean;
  formulas?: allStoredFormulas[];
  tables?: { id: string; name: string }[];
  sqlConnections?: Connection[];
}
