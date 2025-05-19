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
          console.log("THS", this);
          let id = v4();
          if (false) {
            console.log("formulaStore.getState()", formulaStore.getState());
            let lid = element.getAttribute("id") ?? id;
            if (formulaStore.getState().find((f) => f.id === lid)) {
              lid = id;
            }
            formulaStore.setState(
              [
                ...(formulaStore.getState() ?? []),
                {
                  id: lid,
                  formula: element.getAttribute("formula") || "",
                  data: element.getAttribute("data") || "",
                },
              ],
              true
            );
          }
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
    const id = HTMLAttributes.id;
    let content = "";
    
    // Get the calculated value from the formula store
    if (id) {
      const formula = formulaStore.getState().find(f => f.id === id);
      if (formula && formula.data) {
        content = String(formula.data);
      }
    }
    
    // Return the formula tag with its content including the calculated value
    return ["formula", mergeAttributes(HTMLAttributes), content];
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component);
  },
});
