import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import Component from "./math.jsx";
import { formulaStore } from "../../state/formula.js";
import { tableAcions } from "../Editor/const.js";

export default Node.create({
  name: "mathComponent",

  group: "inline",

  atom: true,
  inline: true,

  addAttributes() {
    return {
      id: {
        default: "",
      },
      formula: {
        default: "",
      },
      value: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "math-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["math-component", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component);
  },
});
