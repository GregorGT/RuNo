import { PlusSquareOutlined } from "@ant-design/icons"
import { useState } from "react"

const Filter = () => {
  const [isChecked, setIsChecked] = useState(true)
  return (
    <div className="filter">
      <div className="scope">
        <span>Formula scope:</span>
        <span>Global [X]</span>
        <span>Filtered [ ]</span>
      </div>
      <div className="filter-content">
        <div className="filters">
          <span className="or">Or</span>
          <div className="flex-1">
            <div className="flex items-center">
              <input className="modified" disabled value="Date modified => 07/11/2023" />
              <input
                className="radio-input"
                checked={isChecked}
                type="radio"
                value="option1"
                onChange={() => setIsChecked(true)}
              />
            </div>
            <div className="flex items-center">
              <input className="modified" disabled value="Date modified => 09/11/2023" />
              <input
                className="radio-input"
                checked={!isChecked}
                type="radio"
                value="option2"
                onChange={() => setIsChecked(false)}
              />
            </div>
          </div>
        </div>
        <div className="add-filter">
          <PlusSquareOutlined className="mx-2" />
          Add filter
        </div>
      </div>
      <button className='add-btn mx-auto my-3'>Add filter groups</button>
    </div>
  )
}

export default Filter