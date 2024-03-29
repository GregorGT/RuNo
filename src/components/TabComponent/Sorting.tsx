import { PlusSquareOutlined } from "@ant-design/icons";
import { Select } from "antd";
import { useState } from "react";

const Sorting = () => {
  const [isCheckedA, setIsCheckedA] = useState(false);
  const [isCheckedB, setIsCheckedB] = useState(false);
  // const [option, setOption] = useState('Up')
  return (
    <div className="flex-col">
      <div className="sorting">
        <div className="flex items-center">
          <Select
            className="sorting-select"
            defaultValue="Up"
            style={{ width: 120 }}
            // onChange={(e) =>setOption(e)}
            options={[
              { value: "up", label: "Up" },
              { value: "down", label: "Down" },
            ]}
          />
          <input
            className="modified"
            defaultValue="Date modified => 07/11/2023"
          />
          <input
            className="radio-input"
            checked={isCheckedA}
            type="checkbox"
            value="option1"
            onClick={() => setIsCheckedA(!isCheckedA)}
          />
        </div>
        <div className="flex items-center">
          <Select
            className="sorting-select"
            defaultValue="Up"
            style={{ width: 120 }}
            // onChange={(e) =>setOption(e)}
            options={[
              { value: "up", label: "Up" },
              { value: "down", label: "Down" },
            ]}
          />
          <input className="modified" defaultValue="Date modified" />
          <input
            className="radio-input"
            checked={isCheckedB}
            type="checkbox"
            value="option2"
            onClick={() => setIsCheckedB(!isCheckedB)}
          />
        </div>
        <div className="add-option cursor-pointer">
          <PlusSquareOutlined className="mx-2" />
          Add Option
        </div>
      </div>
      <button className="add-btn mx-auto my-3">Add sort group</button>
    </div>
  );
};

export default Sorting;
