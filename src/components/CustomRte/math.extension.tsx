import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { v4 } from "uuid";
import { formulaStore } from "../../state/formula.js";
import Component from "./math.jsx";
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
        parseHTML(element) {
          if (element.getAttribute("id")) {
            const allFormula = formulaStore.getState();
            if (!allFormula?.find((f) => f.id === element.getAttribute("id"))) {
              formulaStore?.setState(
                [
                  ...allFormula,
                  {
                    id: element.getAttribute("id") || "",
                    data: element.getAttribute("data") || "",
                    formula: element.getAttribute("formula") || "",
                  },
                ],
                true
              );
            }
          }
          return element.getAttribute("id") || "";
        },
      },
      formula: {
        default: "",
        parseHTML(element) {
          return element.getAttribute("formula") || "";
        },
      },
      value: {
        default: "",
        parseHTML(element) {
          return element.getAttribute("value") || "";
        },
      },
      result: {
        default: "",
        parseHTML(element) {
          return element.getAttribute("result") || "";
        },
      },
      data: {
        default: "",
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
          formula: "formula",
          value: "value",
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
