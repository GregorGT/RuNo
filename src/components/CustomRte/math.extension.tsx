import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { v4 } from "uuid";
import { formulaStore } from "../../state/formula.js";
import Component from "./math.tsx";
export default Node.create({
  name: "mathComponent",
  group: "inline",
  atom: true,
  inline: true,

  addAttributes() {
    return {
      id: {
        default: "",
        parseHTML(element) {
          return element.getAttribute("id") || "";
        },
      },
      formula: {
        default: "",
        parseHTML(element) {
          console.log("Parsing formula attribute:", element.getAttribute("formula"));
          // Get the formula attribute from the element
          const formulaAttr = element.getAttribute("formula") || "";
          const id = element.getAttribute("id") || v4();
          
          // Ensure the formula is added to the store when parsing HTML
          setTimeout(() => {
            const existingFormula = formulaStore.getState().find(f => f.id === id);
            if (!existingFormula && id) {
              formulaStore.setState(
                [
                  ...formulaStore.getState(),
                  {
                    id: id,
                    formula: formulaAttr,
                    data: element.getAttribute("data") || "",
                  },
                ],
                true
              );
              console.log("Added formula to store:", id, formulaAttr);
            }
          }, 0);
          
          return formulaAttr;
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
        parseHTML(element) {
          return element.getAttribute("data") || "";
        },
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
    // Return the formula tag WITHOUT adding content directly
    return ["formula", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component);
  },
});
