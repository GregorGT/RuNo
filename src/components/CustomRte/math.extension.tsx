import { mergeAttributes, Node } from "@tiptap/core";
import {
  getMarkType,
  markPasteRule,
  nodePasteRule,
  ReactNodeViewRenderer,
} from "@tiptap/react";

import Component from "./math.jsx";
import { MarkType } from "@tiptap/pm/model";
import { formulaStore } from "../../state/formula.js";
import { nanoid } from "nanoid";
import { v4 } from "uuid";
export default Node.create({
  name: "mathComponent",
  group: "inline",
  atom: true,
  inline: true,

  addAttributes() {
    let id = v4();
    while (formulaStore.getState().find((f) => f.id === id)) {
      id = v4();
    }

    return {
      id: {
        default: id,
      },
      formula: {
        default: "",
      },
      value: {
        default: "",
      },
      isLocal: {
        default: false,
      },
      ["data-type"]: {
        default: "math-component",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "formula",
        attrs: {
          "data-type": "math-component",
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["formula", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component);
  },
});
