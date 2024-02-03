import { useAtom } from "jotai";
import Editor from "../Editor";
import { convertStringToFormula, formula, value } from "../../state/formula";

const Value = () => {
  const [selectedFormula, setSelectedFormula] = useAtom(formula);
  const [selectedValue] = useAtom(value);

  return (
    <div className="value">
      <div>Formula</div>
      <textarea
        className="p-1"
        value={selectedFormula}
        onChange={(e) => {
          setSelectedFormula(e.target.value);
        }}
      />
      <div>Value</div>
      <textarea className="p-1" value={selectedValue} disabled />
    </div>
  );
};

export default Value;
