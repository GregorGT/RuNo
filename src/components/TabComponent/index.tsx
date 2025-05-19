import { useState, useEffect } from "react";
import "../Components.scss";
import Filter from "./Filter";
import Sorting from "./Sorting";
import Value from "./Value";
import Table from "./Table";

export default function TabComponent() {
  const [activeTab, setActiveTab] = useState("filter");
  const Contents = [
    { eventKey: "filter", content: <Filter />, title: "Filter" },
    { eventKey: "sorting", content: <Sorting />, title: "Sorting" },
    { eventKey: "value", content: <Value />, title: "Value" },
    { eventKey: "table", content: <Table />, title: "Table" },
  ];

  // Add event listener for formula clicks to switch to Value tab
  useEffect(() => {
    const handleFormulaClick = () => {
      setActiveTab("value");
    };

    // Listen for the custom event fired when a formula is clicked
    document.addEventListener('formulaClicked', handleFormulaClick);

    // Clean up the event listener when component unmounts
    return () => {
      document.removeEventListener('formulaClicked', handleFormulaClick);
    };
  }, []);

  // Function to render the active content
  const renderContent = () => {
    const activeContent = Contents.find(item => item.eventKey === activeTab);
    return activeContent ? activeContent.content : null;
  };

  return (
    <div className="right-side">
      <div className="tab-component"></div>
      <div className="tab-component">
        <div className="buttons">
          <button
            className={`header-button ${activeTab === "filter" ? "active" : ""}`}
            onClick={() => setActiveTab("filter")}
          >
            Filter
          </button>
          <button
            className={`header-button ${activeTab === "sorting" ? "active" : ""}`}
            onClick={() => setActiveTab("sorting")}
          >
            Sorting
          </button>
          <button
            className={`header-button ${activeTab === "value" ? "active" : ""}`}
            onClick={() => setActiveTab("value")}
          >
            Value
          </button>
          <button
            className={`header-button ${activeTab === "table" ? "active" : ""}`}
            onClick={() => setActiveTab("table")}
          >
            Table
          </button>
        </div>
        
        {/* Render content based on active tab */}
        <div className="tab-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
