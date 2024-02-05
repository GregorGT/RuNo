import "./App.scss";
import Dropdowns from "./components/Dropdowns";
import Entries from "./components/Entries";
import Header from "./components/Header";
import TabComponent from "./components/TabComponent";

function App() {
  return (
    <div className="home">
      <Header />
      <Dropdowns />
      <div className="content">
        <Entries />
        <TabComponent />
      </div>
    </div>
  );
}

export default App;
