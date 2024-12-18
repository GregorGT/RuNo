import { Select } from "antd";
import { useAtom } from "jotai";
import { useCallback } from "react";
import {
  isSortingEnable,
  sortingAtom,
  sortingFnAtom,
} from "../../state/formula";

const Sorting: React.FC = () => {
  const [text, setText] = useAtom(sortingFnAtom);
  const [option, setOption] = useAtom(sortingAtom);
  const [sortingEnable, setIsSortingEnable] = useAtom(isSortingEnable);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value || "");
    },
    [setText]
  );

  const toggleSorting = useCallback(() => {
    setIsSortingEnable(!sortingEnable);
  }, [sortingEnable, setIsSortingEnable]);

  return (
    <div className="flex-col">
      <div className="sorting">
        <div className="flex items-center space-x-2">
          <Select
            className="sorting-select"
            style={{ width: 120 }}
            onChange={(value) => setOption(value || "asc")}
            value={option || "asc"}
            options={[
              { value: "asc", label: "Up" },
              { value: "desc", label: "Down" },
            ]}
          />
          <input
            type="text"
            value={text || ""}
            onChange={handleTextChange}
            className="modified"
            placeholder="Sorting criteria"
          />
          <div className="flex items-center">
            <input
              id="sorting-enable"
              type="checkbox"
              checked={sortingEnable || false}
              onChange={toggleSorting}
              className="radio-input"
              aria-label="Enable Sorting"
            />
            <label htmlFor="sorting-enable" className="ml-2">
              Enable
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sorting;
