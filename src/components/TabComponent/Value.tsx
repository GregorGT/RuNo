import { Checkbox } from "antd";
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
  const [isLocal, setIsLocal] = useState(false);

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
        isLocal: isLocal,
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
              isLocal: isLocal,
            };
          }
          return f;
        })
      );
    }
  };

  const setIsLocalInFormula = (isLocal: boolean) => {
    if (!selectedFormulaId) return;
    setIsLocal(isLocal);
    setAllForumula((old) =>
      old.map((f) => {
        if (f.id === selectedFormulaId) {
          return {
            ...f,
            isLocal: isLocal,
          };
        }
        return f;
      })
    );
  };

  if (!selectedFormulaId) {
    return <p>Please Select Formula From Entries To Get Started</p>;
  }
  return (
    <div className="value">
      <div className="d-flex justify-between">
        <p>Formula</p>
        <div>
          <Checkbox
            checked={isLocal}
            onChange={(e) => setIsLocalInFormula(e.target.checked)}
          >
            Is Entry Specific
          </Checkbox>
        </div>
      </div>
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
