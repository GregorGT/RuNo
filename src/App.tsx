import { useEffect } from 'react';

import "./App.scss";
import Dropdowns from "./components/Dropdowns";
import Entries from "./components/Entries";
import Header from "./components/Header";
import TabComponent from "./components/TabComponent";

import { invoke } from "@tauri-apps/api/core";

function App() {
  useEffect(() => {
    invoke('initialize_trial_file');
  }, [])

  return (
    <div className="home">
      <Header />
      <Dropdowns />
      <div className="content">
        <Entries />
        <TabComponent />
      </div>
      <style id="editor_styles"></style>
    </div>
  );
}

export default App;

