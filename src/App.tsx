import Header from "./components/Header";
import Dropdowns from "./components/Dropdowns";
import Entries from "./components/Entries";
import TabComponent from "./components/TabComponent";
import "./App.scss";

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
