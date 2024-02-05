import { NodeViewWrapper, useCurrentEditor } from "@tiptap/react";
import { useEffect, useState } from "react";
//@ts-ignore
import { useAtom } from "jotai";
import {
  convertStringToFormula,
  formulaAtom,
  formulaStore,
  selectedFormulaIdAtom,
  selectedFormulaIdStore,
} from "../../state/formula";
import { useDebounce } from "react-use";

export default (props: any) => {
  const currentId = props.node.attrs.id;
  const [localValue, setValue] = useState<string | string[] | undefined>("");

  const [allFormula, setAllForumula] = useAtom(formulaAtom);
  const [selectedFormulaId, setSelectedFormula] = useAtom(
    selectedFormulaIdAtom
  );
  const { editor } = useCurrentEditor();

  useEffect(
    () => () => {
      const allFormulaData = formulaStore.getState();
      // Removing the formula from the store
      const newList = allFormulaData.filter((f) => f.id !== currentId);
      formulaStore.setState(newList, true);
      if (selectedFormulaIdStore.getState() === currentId) {
        editor?.commands.setSearchTerm("", currentId);
        selectedFormulaIdStore.setState(undefined, true);
      }
    },
    []
  );

  useEffect(() => {
    if (currentId !== selectedFormulaId) return;
    const selectedFormula = allFormula?.find((f) => f.id === currentId);
    if (!selectedFormula) return;
    props.node.attrs.formula = selectedFormula?.textFormula;
    setValue(selectedFormula?.value);
    const formula = convertStringToFormula(selectedFormula?.textFormula);
    const data = editor?.commands.setSearchTerm(formula.text, currentId);
    return;
  }, [selectedFormulaId, allFormula]);

  const askFormula = async () => {
    const selectedId = props.node.attrs.id;
    setSelectedFormula(selectedId);
    return;
  };

  return (
    <>
      <NodeViewWrapper as={"div"} className="math-component d-inline">
        <button
          onClick={askFormula}
          style={{
            borderColor: currentId !== selectedFormulaId ? "gray" : "green",
            borderWidth: "1px",
            color: currentId !== selectedFormulaId ? "black" : "blue",
            background: "transparent",
            fontFamily: "monospace",
            marginLeft: "0px",
            marginRight: "0px",
          }}
          className="label"
        >
          {Array.isArray(localValue)
            ? localValue.join(",")
            : localValue?.length !== 0
            ? localValue
            : "NULL"}
        </button>
      </NodeViewWrapper>
    </>
  );
};
