import { useAtom, useAtomValue } from "jotai";
import * as _ from "lodash";
import { useEffect, useState, useRef } from "react";
import {
  formulaAtom,
  formulaStore,
  selectedFormulaIdAtom,
} from "../../state/formula";

const Value = () => {
  const [allFormula] = useAtom(formulaAtom);
  const selectedFormulaId = useAtomValue(selectedFormulaIdAtom);
  const [displayValue, setDisplayValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debug log of current formulas in store
  useEffect(() => {
    console.log("All formulas in store:", formulaStore.getState());
    console.log("Selected formula ID:", selectedFormulaId);
  }, [selectedFormulaId]);

  const setFormulaText = (text: string) => {
    const currentFormula = allFormula;
    const changed = currentFormula.map((item) => {
      if (item.id === selectedFormulaId) {
        item.formula = text;
      }
      return item;
    });
    formulaStore.setState(_.cloneDeep(changed), true);
  };

  // Load the formula content when selectedFormulaId changes
  useEffect(() => {
    if (selectedFormulaId) {
      // This will find the formula immediately when selectedFormulaId changes
      const formula = formulaStore.getState().find(item => item.id === selectedFormulaId);
      if (formula) {
        console.log("Found formula:", formula);
        setDisplayValue(formula.formula || "");
        
        // Focus the textarea when formula is selected
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      } else {
        console.log("Formula not found for ID:", selectedFormulaId);
        setDisplayValue("");
      }
    } else {
      setDisplayValue("");
    }
  }, [selectedFormulaId]);

  // Update the formula when displayValue changes, but don't update on initial load
  useEffect(() => {
    if (selectedFormulaId && displayValue) {
      setFormulaText(displayValue);
    }
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
        ref={textareaRef}
        className="p-1"
        value={displayValue}
        onChange={(e) => {
          setDisplayValue(e.target.value);
          setFormulaText(e.target.value);
        }}
        placeholder="Enter your formula here (e.g., SUM(1,1))"
        style={{ 
          width: '100%', 
          minHeight: '100px', 
          padding: '8px',
          fontSize: '16px',
          fontFamily: 'monospace'
        }}
      />
    </div>
  );
};

export default Value;
