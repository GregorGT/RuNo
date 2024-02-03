import { dialog } from "@tauri-apps/api";
import { NodeViewWrapper, useCurrentEditor } from "@tiptap/react";
import React, { useEffect, useState } from "react";
//@ts-ignore
import math from "mathjs-expression-parser";
import { Input, Modal } from "antd";
import { nanoid } from "nanoid";
import { useAtom, useAtomValue } from "jotai";
import {
  convertStringToFormula,
  formula,
  formulaId,
  value,
} from "../../state/formula";

export default (props: any) => {
  const currentId = props.node.attrs.id;
  const [localFormula, setFormula] = useState<string | undefined>();
  const [localValue, setValue] = useState<string | undefined>();

  const [globalFormula, setGlobalFormula] = useAtom(formula);
  const [globalValue, setGlobalValue] = useAtom(value);
  const [globalFormulaId, setGlobalFormulaId] = useAtom(formulaId);

  const { editor } = useCurrentEditor();
  useEffect(() => {
    if (currentId !== globalFormulaId) return;
    if (!globalFormula) return;
    setFormula(globalFormula);
    setValue(globalValue);
    if (globalFormula) {
      editor?.commands.setSearchTerm(convertStringToFormula(globalFormula));
    }
  }, [globalFormula, globalValue]);

  const askFormula = async () => {
    setGlobalFormulaId(props.node.attrs.id);
    setGlobalFormula(localFormula);
    setGlobalValue(localValue);
  };

  return (
    <>
      <NodeViewWrapper className="math-component d-inline">
        <button
          onClick={askFormula}
          style={{
            backgroundColor: "gray",
            fontFamily: "monospace",
            color: "white",
          }}
          className="label"
        >
          {localFormula || localFormula?.trim() === "" ? localFormula : "NULL"}
        </button>
      </NodeViewWrapper>
    </>
  );
};
