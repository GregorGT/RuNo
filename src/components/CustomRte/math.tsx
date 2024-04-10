import { NodeViewWrapper } from "@tiptap/react";
//@ts-ignore
import { useAtom, useAtomValue } from "jotai";
import {
  formulaAtom,
  formulaStore,
  selectedFormulaIdAtom,
  selectedFormulaIdStore,
} from "../../state/formula";
import { useEffect, useState } from "react";

export default (props: any) => {
  const currentId = props.node.attrs.id;
  const allFormulas = useAtomValue(formulaAtom);
  const [data, setData] = useState("");
  const selectedFormulaId = useAtomValue(selectedFormulaIdAtom);
  const askFormula = () => {
    selectedFormulaIdStore.setState(currentId);
  };
  /// ON mount if all formula is empty then we will add a new formula
  const isCurrentSelected = currentId !== selectedFormulaIdStore.getState();

  useEffect(() => {
    const formula = formulaStore.getState().find((f) => f.id == currentId);
    props.node.attrs.formula = formula?.formula || "";
    props.node.attrs.data = formula?.data || "";
    setData(formula?.data || "");
  }, [selectedFormulaId, allFormulas]);

  return (
    <>
      <NodeViewWrapper
        style={{
          borderColor: isCurrentSelected ? "gray" : "green",
          borderWidth: "1px",
          color: isCurrentSelected ? "black" : "blue",
          background: "transparent",
          fontFamily: "monospace",
          marginLeft: "0px",
          marginRight: "0px",
        }}
        onClick={askFormula}
        className="math-component d-inline"
      >
        {data === "" || !data ? "Click to add/edit formula" : data}
      </NodeViewWrapper>
    </>
  );
};
