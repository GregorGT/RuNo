import {
  CloseCircleOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import "./Components.scss";

export default function Header() {
  return (
    <div className="header px-3">
      <span className="mx-3">OpenSource</span>
      <div className="icons">
        <MinusCircleOutlined className="cursor-pointer" />
        <PlusCircleOutlined className="cursor-pointer" />
        <CloseCircleOutlined className="cursor-pointer" />
      </div>
    </div>
  );
}
