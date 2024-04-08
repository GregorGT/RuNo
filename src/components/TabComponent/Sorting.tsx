import { Select } from "antd";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { sortingAtom, sortingFnAtom } from "../../state/formula";

const Sorting = () => {
  const [text, setText] = useState<string>("");
  const [_, setSortingFn] = useAtom(sortingFnAtom);
  const [option, setOption] = useAtom(sortingAtom);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (isChecked) {
      setSortingFn(text);
    } else {
      setSortingFn("");
    }
  }, [isChecked, text]);
  return (
    <div className="flex-col">
      <div className="sorting">
        <div className="flex items-center">
          <Select
            className="sorting-select"
            style={{ width: 120 }}
            onChange={(e) => setOption(e)}
            value={option}
            options={[
              { value: "asc", label: "Up" },
              { value: "desc", label: "Down" },
            ]}
          />
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            className="modified"
          />
          <input
            className="radio-input"
            type="checkbox"
            checked={isChecked}
            onClick={() => {
              setIsChecked(!isChecked);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Sorting;
