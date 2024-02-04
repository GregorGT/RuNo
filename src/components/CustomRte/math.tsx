import { NodeViewWrapper, useCurrentEditor } from "@tiptap/react";
import { useEffect, useState } from "react";
//@ts-ignore
import { useAtom } from "jotai";
import {
  convertStringToFormula,
  formulaAtom,
  selectedFormulaIdAtom,
} from "../../state/formula";

export default (props: any) => {
  const currentId = props.node.attrs.id;
  const [localFormula, setFormula] = useState<string | undefined>("");
  const [localValue, setValue] = useState<string | string[] | undefined>("");

  const [allFormula, setAllForumula] = useAtom(formulaAtom);
  const [selectedFormulaId, setSelectedFormula] = useAtom(
    selectedFormulaIdAtom
  );

  const { editor } = useCurrentEditor();
  useEffect(() => {
    if (currentId !== selectedFormulaId) return;
    console.log("currentId", currentId);
    console.log("allFormula", allFormula);
    const selectedFormula = allFormula?.find((f) => f.id === currentId);
    if (!selectedFormula) return;
    props.node.attrs.formula = selectedFormula?.textFormula;
    setValue(selectedFormula?.value);
    const data = editor?.commands.setSearchTerm(
      convertStringToFormula(selectedFormula?.textFormula)
    );
    if (!data?.findings) return;
  }, [selectedFormulaId, allFormula]);

  const askFormula = async () => {
    const selectedId = props.node.attrs.id;
    setSelectedFormula(selectedId);
    return;
  };

  console.log(localFormula);
  return (
    <>
      <NodeViewWrapper className="math-component d-inline">
        <button
          onClick={askFormula}
          style={{
            backgroundColor: currentId !== selectedFormulaId ? "gray" : "green",
            fontFamily: "monospace",
            color: "white",
          }}
          className="label"
        >
          {localValue || localValue?.trim() !== "" || localValue.length !== 0
            ? localValue
            : "NULL"}
        </button>
      </NodeViewWrapper>
    </>
  );
};
