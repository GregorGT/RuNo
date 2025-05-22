import { useAtom } from "jotai";
import { filterFnAtom, isFilterEnable } from "../../state/formula";

const Filter = () => {
  const [isChecked, setIsChecked] = useAtom(isFilterEnable);
  const [text, setText] = useAtom(filterFnAtom);

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
            defaultChecked
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
              />
              <input
                className="radio-input"
                checked={isChecked}
                type="checkbox"
                value="option1"
                onChange={() => setIsChecked(!isChecked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filter;
