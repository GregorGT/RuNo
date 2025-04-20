import { useState, useEffect } from "react";

import "./App.scss";
import Dropdowns from "./components/Dropdowns";
import Entries from "./components/Entries";
import Header from "./components/Header";
import TabComponent from "./components/TabComponent";
import RegisterLicenseDialog from "./components/Dialog/RegisterLicense";

import { invoke } from '@tauri-apps/api/core';

function App() {
  const [bRegisterLicense, setBRegisterLicense] = useState(false);
  const [bTrialExpired, setBTrialExpired] = useState(false)

  useEffect(() => {
    invoke<boolean>("is_trial_valid")
      .then((res) => {
        setBTrialExpired(res);
      })
      .catch((err) => {
        console.error("Trial check error:", err);
        setBTrialExpired(false); // default to invalid if tampered
      })
  }, []);

  return (
    <div className="home">
      {
        bRegisterLicense &&
        <RegisterLicenseDialog
          closeDialog={() => setBRegisterLicense(false)}
          onSubmit={alert}
        />
      }
      <Header />
      <Dropdowns
        showDialog={
          () => setBRegisterLicense(true)
        }
      />
      <div className="content">
        <Entries />
        <TabComponent />
      </div>
      <style id="editor_styles"></style>
    </div>
  );
}

export default App;
