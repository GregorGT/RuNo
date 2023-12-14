import type { MenuProps } from 'antd';
import { Dropdown  } from 'antd';
import './Components.scss'

export default function Dropdowns() {
  const fileItems: MenuProps['items'] = [
      { key:1, label: "Load" },
      { key:2, label: "Save" },
      { key:3, label: "Exit" },
      { key:4, label: "Export" },
      { key:5, label: "Import" }
  ];
  const editItems: MenuProps['items'] = [
      { key:1, label: "Copy" },
      { key:2, label: "Paste" },
      { key:3, label: "Text foratting" }
  ];
  const infoItems: MenuProps['items'] = [
      { key:1, label: "About" },
      { key:2, label: "Donate" },
      { key:3, label: "Contact" }
  ];

  return (
    <div className="dropdowns">
      <Dropdown menu={{ items: fileItems }} placement="bottomLeft">
        <span>File</span>
      </Dropdown>
      <Dropdown menu={{ items: editItems }} placement="bottomLeft">
        <span>Edit</span>
      </Dropdown>
      <Dropdown menu={{ items: infoItems }} placement="bottomLeft">
        <span>Info</span>
      </Dropdown>
    </div>
  )
}