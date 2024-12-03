import { useAtom, useAtomValue } from "jotai";
import * as _ from "lodash";
import { useEffect, useState } from "react";
import {
  formulaAtom,
  formulaStore,
  selectedFormulaIdAtom,
} from "../../state/formula";
const Value = () => {
  const [allFormula] = useAtom(formulaAtom);
  const selectedFormulaId = useAtomValue(selectedFormulaIdAtom);

  const setFormulaText = (text: string) => {
    const currentFormula = allFormula;
    const changed = currentFormula.map((item) => {
      if (item.id === selectedFormulaId) {
        item.formula = text;
        console.log("item", item);
      }
      return item;
    });
    return formulaStore.setState(_.cloneDeep(changed), true);
  };

  const [displayValue, setDisplayValue] = useState("");
  useEffect(() => {
    if (selectedFormulaId) {
      const formula = allFormula?.find((item) => item.id === selectedFormulaId);
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
          setFormulaText(e.target.value);
        }}
      />
    </div>
  );
};

export default Value;
