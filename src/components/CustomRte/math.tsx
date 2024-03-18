import { NodeViewWrapper, useCurrentEditor } from "@tiptap/react";
import { useEffect, useState } from "react";
//@ts-ignore
import { useAtom, useAtomValue } from "jotai";
import {
  formulaAtom,
  formulaStore,
  selectedFormulaIdAtom,
  selectedFormulaIdStore,
  selectedFormulaTextAtom,
} from "../../state/formula";
import { useDebounce, useInterval, useTimeoutFn } from "react-use";

export default (props: any) => {
  const currentId = props.node.attrs.id;
  const [localValue, setValue] = useState<
    string | string[] | undefined | number
  >("");

  const [allFormula] = useAtom(formulaAtom);
  const [selectedFormulaId, setSelectedFormula] = useAtom(
    selectedFormulaIdAtom
  );
  const { editor } = useCurrentEditor();
  const selectedFormulaData = useAtomValue(selectedFormulaTextAtom);
  // This WIll Run On UnMount
  useEffect(
    () => () => {
      const allFormulaData = formulaStore.getState();
      // Removing the formula from the store
      // Enable This If We Want To Delete The Formula When Deleting
      // const newList = allFormulaData.filter((f) => f.id !== currentId);
      // formulaStore.setState(newList, true);
      if (selectedFormulaIdStore.getState() === currentId) {
        // editor?.commands.setSearchTerm("", currentId);
        selectedFormulaIdStore.setState(undefined, true);
      }
    },
    []
  );

  //Function That Will Work On Any Changes In Editor with 1 sec delay so we dont make it all slow
  useInterval(
    () => {
      const selectedFormula = allFormula?.find((f) => f.id === currentId);
      if (!selectedFormula || currentId === selectedFormulaId) return;
      props.node.attrs.formula = selectedFormula?.textFormula;
      props.node.attrs.isLocal = selectedFormula?.isLocal;
      // editor?.commands.setSearchTerm(selectedFormula?.textFormula, currentId);
    },
    1000 // Making this smaller will make the editor slow as it will run on every change / complexity is O(Formula Length * Node) basically too much
  );

  //This Will Run On Formula Selected Or Changed Its Formula
  useEffect(
    () => {
      if (currentId !== selectedFormulaId) return;
      const selectedFormula = allFormula?.find((f) => f.id === currentId);
      if (!selectedFormula) return;
      setValue(selectedFormula?.result ?? selectedFormula?.value);
      props.node.attrs.formula = selectedFormula?.textFormula;
      props.node.attrs.isLocal = selectedFormula?.isLocal;
    },
    // 200,
    [selectedFormulaId, selectedFormulaData]
  );

  const askFormula = async () => {
    const selectedId = props.node.attrs.id;
    setSelectedFormula(selectedId);
    return;
  };

  useEffect(() => {
    const selectedFormula = allFormula?.find((f) => f.id === currentId);
    props.node.attrs.formula = selectedFormula?.textFormula;
    props.node.attrs.isLocal = selectedFormula?.isLocal;
    props.node.attrs.value = selectedFormula?.result ?? selectedFormula?.value;
    setValue(selectedFormula?.result ?? selectedFormula?.value);
  }, [allFormula]);

  return (
    <>
      <NodeViewWrapper
        style={{
          borderColor: currentId !== selectedFormulaId ? "gray" : "green",
          borderWidth: "1px",
          color: currentId !== selectedFormulaId ? "black" : "blue",
          background: "transparent",
          fontFamily: "monospace",
          marginLeft: "0px",
          marginRight: "0px",
        }}
        onClick={askFormula}
        className="math-component d-inline"
      >
        {allFormula?.find((f) => f.id === currentId)?.textFormula ??
          "Click To Insert Formula"}
      </NodeViewWrapper>
    </>
  );
};
