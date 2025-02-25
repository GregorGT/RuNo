import { useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import "../Components.scss";
import Filter from "./Filter";
import Sorting from "./Sorting";
import Value from "./Value";
import Table from "./Table";

export default function TabComponent() {
  const [activeTab, setActiveTab] = useState("filter");
  const Contents = [
    { eventKey: "filter", content: <Filter /> },
    { eventKey: "sorting", content: <Sorting /> },
    { eventKey: "value", content: <Value /> },
    { eventKey: "table", content: <Table /> },
  ];

  return (
    <div className="right-side">
      <div className="tab-component"></div>
      <div className="tab-component">
        <div className="buttons">
          <button
            className={`header-button ${activeTab == "filter" && "active"}`}
            onClick={() => setActiveTab("filter")}
          >
            Filter
          </button>
          <button
            className={`header-button ${activeTab == "sorting" && "active"}`}
            onClick={() => setActiveTab("sorting")}
          >
            Sorting
          </button>
          <button
            className={`header-button ${activeTab == "value" && "active"}`}
            onClick={() => setActiveTab("value")}
          >
            Value
          </button>
          <button
            className={`header-button ${activeTab == "table" && "active"}`}
            onClick={() => setActiveTab("table")}
          >
            Table
          </button>
        </div>
        <Tabs activeKey={activeTab} className="mb-3">
          {Contents.map((item) => (
            //@ts-ignore
            <Tab eventKey={item.eventKey}>{item.content}</Tab>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
