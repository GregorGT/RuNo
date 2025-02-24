import { atomWithStore } from "jotai-zustand";
import { createStore } from "zustand/vanilla";

export const selectedTableStore = createStore<{ id: string; name?: string }>(() => ({
  id: "",
  name: undefined,
}));

export const selectedTableAtom = atomWithStore(selectedTableStore);
