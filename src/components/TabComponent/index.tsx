import React, { useState } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import "../Components.scss";
import Filter from "./Filter";
import Sorting from "./Sorting";
import Value from "./Value";

export default function TabComponent() {
  const [activeTab, setActiveTab] = useState("filter");

  const Contents = React.useMemo(
    () => [
      { eventKey: "filter", content: <Filter />, label: "Filter" },
      { eventKey: "sorting", content: <Sorting />, label: "Sorting" },
      { eventKey: "value", content: <Value />, label: "Value" },
    ],
    []
  );

  return (
    <div className="right-side">
      <div className="tab-component">
        <div className="buttons">
          {Contents.map((item) => (
            <button
              key={item.eventKey}
              className={`header-button ${
                activeTab === item.eventKey ? "active" : ""
              }`}
              onClick={() => setActiveTab(item.eventKey)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Tabs
          activeKey={activeTab}
          className="mb-3"
          onSelect={(k) => setActiveTab(k || "filter")}
        >
          {Contents.map((item) => (
            <Tab
              key={item.eventKey}
              eventKey={item.eventKey}
              title={item.label} 
            >
              {item.content}
            </Tab>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
