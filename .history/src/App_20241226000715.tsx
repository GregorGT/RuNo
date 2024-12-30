import "./App.scss";
import Dropdowns from "./components/Dropdowns";
import Entries from "./components/Entries";
import Header from "./components/Header";
import TabComponent from "./components/TabComponent";

function App() {
  return (
    <div className="home">
      <Header/>
      <div className="content">
        <Entries />
      </div>
      <style id="editor_styles"></style>
    </div>
  );
}

export default App;
