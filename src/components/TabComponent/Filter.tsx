import { useAtom } from "jotai";
import { useCallback } from "react";
import { filterFnAtom, isFilterEnable } from "../../state/formula";

const Filter: React.FC = () => {
  const [isChecked, setIsChecked] = useAtom(isFilterEnable);
  const [text, setText] = useAtom(filterFnAtom);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
    },
    [setText]
  );

  const toggleFilter = useCallback(() => {
    setIsChecked(!isChecked);
  }, [isChecked, setIsChecked]);

  return (
    <div className="filter">
      <div className="scope">
        <span>Formula scope:</span>
        <fieldset>
          <legend className="sr-only">Scope Options</legend>
          <div className="flex items-center mx-3">
            <input
              id="global-scope"
              className="radio-input"
              type="radio"
              name="scope"
              checked
              readOnly
            />
            <label htmlFor="global-scope">Global</label>
          </div>
          <div className="flex items-center">
            <input
              id="filtered-scope"
              className="radio-input"
              type="radio"
              name="scope"
              disabled
            />
            <label htmlFor="filtered-scope">Filtered</label>
          </div>
        </fieldset>
      </div>
      <div className="filter-content">
        <div className="filters">
          <div className="flex-1">
            <label htmlFor="filter-function" className="label">
              Filter Function
            </label>
            <div className="flex items-center">
              <input
                id="filter-function"
                value={text}
                onChange={handleTextChange}
                placeholder="Filter function"
                className="modified"
              />
              <div className="flex items-center">
                <input
                  id="enable-filter"
                  className="radio-input"
                  checked={isChecked}
                  type="checkbox"
                  onChange={toggleFilter}
                />
                <label htmlFor="enable-filter" className="ml-2">
                  Enable
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filter;
