import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { formulaAtom, selectedFormulaIdAtom } from "../../state/formula";

const Value = () => {
  const [allFormula, setAllForumula] = useAtom(formulaAtom);
  const [selectedFormulaId, setSelectedFormula] = useAtom(
    selectedFormulaIdAtom
  );
  const [thisValueData, setThisValueData] = useState<
    string | string[] | undefined
  >();
  const [thisFormula, setThisFormula] = useState<string | undefined>("");

  useEffect(() => {
    if (!selectedFormulaId) return;
    const selectedFormula = allFormula.find((f) => f.id === selectedFormulaId);
    if (!selectedFormula) return;
    setThisValueData(
      allFormula.find((f) => f.id === selectedFormulaId)?.value || ""
    );
  }, [selectedFormulaId, allFormula]);

  useEffect(() => {
    if (!selectedFormulaId) return;
    const selectedFormula = allFormula.find((f) => f.id === selectedFormulaId);
    if (!selectedFormula) {
      setThisValueData("");
      setThisFormula("");
    } else {
      setThisFormula(selectedFormula.textFormula);
    }
  }, [selectedFormulaId]);

  const onChangeFunction = (e: any) => {
    if (!selectedFormulaId) return;
    setThisFormula(e.target.value || "");
    const isIdInFormula = allFormula.find((f) => f.id === selectedFormulaId);

    if (!isIdInFormula) {
      const newFormula = {
        id: selectedFormulaId,
        textFormula: "",
        value: "",
        result: "",
      };
      setAllForumula((old) => [...old, newFormula]);
    } else {
      setAllForumula((old) =>
        old.map((f) => {
          if (f.id === selectedFormulaId) {
            return {
              ...f,
              textFormula: e.target.value || "",
              result: "",
            };
          }
          return f;
        })
      );
    }
  };

  if (!selectedFormulaId) {
    return <p>Please Select Formula From Entries To Get Started</p>;
  }
  return (
    <div className="value">
      <div>Formula </div>
      <span>{}</span>
      <textarea
        className="p-1"
        value={thisFormula}
        onChange={onChangeFunction}
      />
      <div>Value</div>
      <textarea className="p-1" value={thisValueData} disabled />
    </div>
  );
};

export default Value;
