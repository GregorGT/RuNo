import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import Component from "./math.jsx";

export default Node.create({
  name: "mathComponent",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      formula: {
        default: "10*10",
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
