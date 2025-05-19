import { NodeViewWrapper } from "@tiptap/react";
//@ts-ignore
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import {
  formulaAtom,
  formulaStore,
  selectedFormulaIdAtom,
  selectedFormulaIdStore,
} from "../../state/formula";

export default (props: any) => {
  const currentId = props.node.attrs.id;
  const allFormulas = useAtomValue(formulaAtom);
  const [data, setData] = useState("");
  const selectedFormulaId = useAtomValue(selectedFormulaIdAtom);
  
  const askFormula = () => {
    // Set the selected formula id in the store
    selectedFormulaIdStore.setState(currentId);
    
    // Dispatch a custom event to notify that a formula was clicked
    // This will be used by TabComponent to switch to the Value tab
    const event = new CustomEvent('formulaClicked', { 
      detail: { formulaId: currentId } 
    });
    document.dispatchEvent(event);
  };
  
  /// ON mount if all formula is empty then we will add a new formula
  const isCurrentSelected = currentId !== selectedFormulaIdStore.getState();

  useEffect(() => {
    //  Check if the formula is already present in the store
    const formula = formulaStore?.getState().find((f) => f.id == currentId);
    if (!formula) {
      formulaStore.setState(
        [
          ...formulaStore.getState(),
          {
            id: currentId,
            formula: props.node.attrs.formula || "",
            data: props.node.attrs.data || "",
          },
        ],
        true
      );
    }
  }, []);

  // useEffect(() => {
  //   formulaStore.subscribe((formulas) => {
  //     const formula = formulas.find((f) => f.id == currentId);
  //     props.updateAttributes({
  //       formula: formula?.formula || "",
  //       data: formula?.data || "",
  //     });
  //     setData(formula?.data || "");
  //   });
  // }, []);

  useEffect(() => {
    console.log("props", props);
    const formula = formulaStore.getState().find((f) => f.id == currentId);
    props.updateAttributes({
      formula: formula?.formula || "",
      data: formula?.data || "",
    });

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
