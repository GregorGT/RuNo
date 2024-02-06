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

export default Node.create({
  name: "mathComponent",
  group: "inline",
  atom: true,
  inline: true,

  onCreate() {
    console.log("Created");
  },

  addAttributes() {
    let id = nanoid();
    console.log("New Id");
    while (formulaStore.getState().find((f) => f.id === id)) {
      id = nanoid();
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
        tag: "div",
        attrs: {
          "data-type": "math-component",
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    console.log("HTMLAttributes", HTMLAttributes);
    return ["div", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component);
  },
});
