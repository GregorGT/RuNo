import { PlusSquareOutlined } from "@ant-design/icons";
import { Select } from "antd";
import { useState } from "react";

const Filter = () => {
  const [isCheckedA, setIsCheckedA] = useState(false);
  const [isCheckedB, setIsCheckedB] = useState(false);
  const [isCheckedFormula, setIsCheckedFormula] = useState(true);

  return (
    <div className="filter">
      <div className="scope">
        <span>Formula scope:</span>
        <div className="flex items-center mx-3">
          Global
          <input
            className="radio-input"
            checked={isCheckedFormula}
            type="checkbox"
            value="option2"
            onClick={() => setIsCheckedFormula(true)}
          />
        </div>
        <div className="flex items-center">
          Filtered
          <input
            className="radio-input"
            checked={!isCheckedFormula}
            type="checkbox"
            value="option2"
            onClick={() => setIsCheckedFormula(false)}
          />
        </div>
      </div>
      <div className="filter-content">
        <div className="filters">
          <Select
            className="or"
            defaultValue="Or"
            style={{ width: 120 }}
            // onChange={(e) =>setOption(e)}
            options={[
              { value: "or", label: "OR" },
              { value: "and", label: "AND" },
            ]}
          />
          <div className="flex-1">
            <div className="flex items-center">
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
              <input
                className="modified"
                defaultValue="Date modified => 09/11/2023"
              />
              <input
                className="radio-input"
                checked={isCheckedB}
                type="checkbox"
                value="option2"
                onClick={() => setIsCheckedB(!isCheckedB)}
              />
            </div>
          </div>
        </div>
        <div className="add-filter cursor-pointer">
          <PlusSquareOutlined className="mx-2" />
          Add filter
        </div>
      </div>
      <button className="add-btn mx-auto my-3">Add filter groups</button>
    </div>
  );
};

export default Filter;
