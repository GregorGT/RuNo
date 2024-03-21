import { Checkbox } from "antd";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { formulaAtom, selectedFormulaIdAtom } from "../../state/formula";

const Value = () => {
  const [allFormula, setAllForumula] = useAtom(formulaAtom);
  const selectedFormulaId = useAtomValue(selectedFormulaIdAtom);

  const setFormulaText = (text: string) => {
    const currentFormula = allFormula;
    const changed = currentFormula.map((item) => {
      if (item.id === selectedFormulaId) {
        item.formula = text;
      }
      return item;
    });

    return setAllForumula([...changed]);
  };

  const [displayValue, setDisplayValue] = useState("");
  useEffect(() => {
    if (selectedFormulaId) {
      const formula = allFormula.find((item) => item.id === selectedFormulaId);
      setDisplayValue(formula?.formula || "");
    }
  }, [allFormula, selectedFormulaId]);
  useEffect(() => {
    setFormulaText(displayValue);
  }, [displayValue]);

  if (!selectedFormulaId) {
    return <p>Please Select Formula From Entries To Get Started</p>;
  }

  return (
    <div className="value">
      <div className="d-flex justify-between">
        <p>Formula</p>
      </div>
      <textarea
        className="p-1"
        value={displayValue}
        onChange={(e) => {
          setDisplayValue(e.target.value);
        }}
      />
    </div>
  );
};

export default Value;
