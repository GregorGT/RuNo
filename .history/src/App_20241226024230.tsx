import "./App.scss";
import Dropdowns from "./components/Dropdowns";
import Entries from "./components/Entries";
import Header from "./components/TabComponent/Header";
import TabComponent from "./components/TabComponent";

function App() {
  return (
    <div className="home">
      <Header/>
      <div className="content">
        <Entries />
        <TabComponent />
      </div>
      <style id="editor_styles"></style>
    </div>
  );
}

export default App;
