import Header from "./components/Header";
import Dropdowns from "./components/Dropdowns";
import Entries from "./components/Entries";
import Tabs from "./components/Navigation";
import "./App.scss";

function App() {
    return (
        <div className="home">
            <Header />
            <Dropdowns />
            <div className="content">
                <Entries />
                <Tabs />
            </div>
        </div>
    );
}

export default App;
