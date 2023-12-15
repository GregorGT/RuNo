import { PlusSquareOutlined } from "@ant-design/icons"
import { useState } from "react"

const Sorting = () => {
  const [isChecked, setIsChecked] = useState(true)
  return (
    <div className="flex-col">
      <div className="sorting">
        <div className="flex items-center">
          <input className="modified w-1 flex-0" disabled value="Up" />
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
          <input className="modified w-1 flex-0" disabled value="Down" />
          <input className="modified" disabled value="Date modified" />
          <input
            className="radio-input"
            checked={!isChecked}
            type="radio"
            value="option2"
            onChange={() => setIsChecked(false)}
          />
        </div>
        <div className="add-option">
          <PlusSquareOutlined className="mx-2" />
          Add Option
        </div>
      </div>
      <button className='add-btn mx-auto my-5'>Add sort group</button>
    </div>
  )
}

export default Sorting