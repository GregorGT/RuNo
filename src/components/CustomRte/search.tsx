import { Extension, Range, type Dispatch } from "@tiptap/core";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  Plugin,
  PluginKey,
  type EditorState,
  type Transaction,
} from "@tiptap/pm/state";
import { Node as PMNode } from "@tiptap/pm/model";
import {
  formulaAtom,
  formulaStore,
  selectedFormulaIdStore,
} from "../../state/formula";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    search: {
      /**
       * @description Set search term in extension.
       */
      setSearchTerm: (
        searchTerm: string,
        id: string
      ) => {
        find: boolean;
        findings: string[];
      };
      /**
       * @description Set replace term in extension.
       */
      setReplaceTerm: (replaceTerm: string) => ReturnType;
      /**
       * @description Set case sensitivity in extension.
       */
      setCaseSensitive: (caseSensitive: boolean) => ReturnType;
      /**
       * @description Reset current search result to first instance.
       */
      resetIndex: () => ReturnType;
      /**
       * @description Find next instance of search result.
       */
      nextSearchResult: () => ReturnType;
      /**
       * @description Find previous instance of search result.
       */
      previousSearchResult: () => ReturnType;
      /**
       * @description Replace first instance of search result with given replace term.
       */
      replace: () => ReturnType;
      /**
       * @description Replace all instances of search result with given replace term.
       */
      replaceAll: () => ReturnType;
    };
  }
}

interface TextNodesWithPosition {
  text: string;
  pos: number;
}

const getRegex = (
  s: string,
  disableRegex: boolean,
  caseSensitive: boolean
): RegExp => {
  try {
    return RegExp(
      disableRegex ? s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : s,
      caseSensitive ? "gu" : "gui"
    );
  } catch (e) {
    return new RegExp("");
  }
};

interface ProcessedSearches {
  decorationsToReturn: DecorationSet;
  results: Range[];
  finalData: string[];
}

function processSearches(
  doc: PMNode,
  searchTerm: RegExp,
  searchResultClass: string,
  resultIndex: number
): ProcessedSearches {
  const decorations: Decoration[] = [];
  const results: Range[] = [];

  let textNodesWithPosition: TextNodesWithPosition[] = [];
  let index = 0;

  if (!searchTerm) {
    return {
      decorationsToReturn: DecorationSet.empty,
      results: [],
      finalData: [],
    };
  }

  doc?.descendants((node, pos) => {
    const isSelectedNode = selectedFormulaIdStore.getState() === node.attrs.id;
    const isValidMathNode =
      node.type.name === "mathComponent" && !isSelectedNode;
    if (node.isText || isValidMathNode) {
      if (textNodesWithPosition[index]) {
        let value = formulaStore
          .getState()
          .find((e) => e.id === node.attrs.id)?.value;

        if (Array.isArray(value)) {
          value = value.join(",");
        }
        console.log(textNodesWithPosition[index].text + (node.text ?? value));

        textNodesWithPosition[index] = {
          text: textNodesWithPosition[index].text + (node.text ?? value),
          pos: textNodesWithPosition[index].pos,
        };
      } else {
        textNodesWithPosition[index] = {
          text: `${node.text}`,
          pos,
        };
      }
    } else {
      index += 1;
    }
  });

  textNodesWithPosition = textNodesWithPosition.filter(Boolean);
  let finalData = [];
  for (const element of textNodesWithPosition) {
    const { text, pos } = element;
    let matches = [];
    try {
      matches = Array.from(text.matchAll(searchTerm)).filter(([matchText]) =>
        matchText.trim()
      );
    } catch (e) {
      return {
        decorationsToReturn: DecorationSet.empty,
        results: [],
        finalData: [],
      };
    }

    const matchedData = Array.from(text.matchAll(searchTerm));
    finalData.push(...matchedData.map((e) => e[e.length - 1]));

    for (const m of matches) {
      if (m[0] === "") break;

      if (m.index !== undefined) {
        results.push({
          from: pos + m.index,
          to: pos + m.index + m[0].length,
        });
      }
    }
  }

  for (let i = 0; i < results.length; i += 1) {
    const r = results[i];
    const className =
      i === resultIndex
        ? `${searchResultClass} ${searchResultClass}-current`
        : searchResultClass;
    const decoration: Decoration = Decoration.inline(r.from, r.to, {
      class: className,
    });

    decorations.push(decoration);
  }
  return {
    decorationsToReturn: DecorationSet.create(doc, decorations),
    results,
    finalData,
  };
}

export const searchAndReplacePluginKey = new PluginKey(
  "searchAndReplacePlugin"
);

export interface SearchAndReplaceOptions {
  searchResultClass: string;
  disableRegex: boolean;
}

export interface SearchAndReplaceStorage {
  searchTerm: string;
  replaceTerm: string;
  results: Range[];
  lastSearchTerm: string;
  caseSensitive: boolean;
  lastCaseSensitive: boolean;
  resultIndex: number;
  lastResultIndex: number;
}

export const SearchAndReplace = Extension.create<
  SearchAndReplaceOptions,
  SearchAndReplaceStorage
>({
  name: "searchAndReplace",

  addOptions() {
    return {
      searchResultClass: "search-result",
      disableRegex: true,
    };
  },

  addStorage() {
    return {
      searchTerm: "",
      replaceTerm: "",
      results: [],
      lastSearchTerm: "",
      caseSensitive: false,
      lastCaseSensitive: false,
      resultIndex: 0,
      lastResultIndex: 0,
      selectedId: "",
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (searchTerm: string, id: string) =>
        ({ editor }) => {
          editor.storage.searchAndReplace.searchTerm = searchTerm;
          editor.storage.searchAndReplace.selectedId = id;
          // const { setState, getState } = selectedDataStore;
          // const currentState = getState;
          // const { getState: formulaState } = formulaIdStore;

          // const listAllData = currentState();
          // const formulaId = formulaState();
          // let allFindings: string[] = [];
          // if (
          //   formulaId &&
          //   listAllData &&
          //   listAllData?.hasOwnProperty(formulaId)
          // ) {
          //   try {
          //     allFindings = listAllData[formulaId] as unknown as string[];
          //   } catch {}
          // }
          const values = formulaStore
            .getState()
            .find((e) => e.id === selectedFormulaIdStore.getState())?.value;

          return {
            find: true,
            findings: values,
          };
        },
      setReplaceTerm:
        (replaceTerm: string) =>
        ({ editor }) => {
          editor.storage.searchAndReplace.replaceTerm = replaceTerm;

          return false;
        },
      setCaseSensitive:
        (caseSensitive: boolean) =>
        ({ editor }) => {
          editor.storage.searchAndReplace.caseSensitive = caseSensitive;

          return false;
        },
      resetIndex:
        () =>
        ({ editor }) => {
          editor.storage.searchAndReplace.resultIndex = 0;

          return false;
        },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const { searchResultClass, disableRegex } = this.options;

    const setLastSearchTerm = (t: string) =>
      (editor.storage.searchAndReplace.lastSearchTerm = t);
    const setLastCaseSensitive = (t: boolean) =>
      (editor.storage.searchAndReplace.lastCaseSensitive = t);
    const setLastResultIndex = (t: number) =>
      (editor.storage.searchAndReplace.lastResultIndex = t);

    return [
      new Plugin({
        key: searchAndReplacePluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply({ doc, docChanged }, oldState) {
            const {
              searchTerm,
              lastSearchTerm,
              caseSensitive,
              lastCaseSensitive,
              resultIndex,
              lastResultIndex,
              selectedId,
            } = editor.storage.searchAndReplace;

            if (
              !docChanged &&
              lastSearchTerm === searchTerm &&
              lastCaseSensitive === caseSensitive &&
              lastResultIndex === resultIndex
            )
              return oldState;

            setLastSearchTerm(searchTerm);
            setLastCaseSensitive(caseSensitive);
            setLastResultIndex(resultIndex);

            if (!searchTerm) {
              editor.storage.searchAndReplace.results = [];
              return DecorationSet.empty;
            }

            const { decorationsToReturn, results, finalData } = processSearches(
              doc,
              getRegex(searchTerm, disableRegex, caseSensitive),
              searchResultClass,
              resultIndex
            );
            const { getState, setState } = formulaStore;
            const currentSelectedId = selectedId;
            const currentId = currentSelectedId;
            const listAllData = getState();
            const newData = listAllData.map((f) => {
              if (f.id === currentId) {
                return {
                  ...f,
                  value: finalData,
                };
              }
              return f;
            });

            setState([...newData], true);

            editor.storage.searchAndReplace.results = results;

            return decorationsToReturn;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

export default SearchAndReplace;
