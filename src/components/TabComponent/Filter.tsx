import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { filterFnAtom } from "../../state/formula";

const Filter = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [_, setFilterFunction] = useAtom(filterFnAtom);
  const [text, setText] = useState<string>("");

  useEffect(() => {
    if (isChecked) {
      setFilterFunction(text);
    } else {
      setFilterFunction("");
    }
  }, [isChecked, text]);

  return (
    <div className="filter">
      <div className="scope">
        <span>Formula scope:</span>
        <div className="flex items-center mx-3">
          Global
          <input
            className="radio-input"
            type="checkbox"
            value="option2"
            checked
          />
        </div>
        <div className="flex items-center">
          Filtered
          <input
            className="radio-input"
            type="checkbox"
            value="option2"
            disabled
          />
        </div>
      </div>
      <div className="filter-content">
        <div className="filters">
          <div className="flex-1">
            <label className="label">Filter Function</label>
            <div className="flex items-center">
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                }}
                placeholder="Filter function"
                className="modified"
                defaultValue="Date modified => 07/11/2023"
              />
              <input
                className="radio-input"
                checked={isChecked}
                type="checkbox"
                value="option1"
                onClick={() => setIsChecked(!isChecked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filter;
