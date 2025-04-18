import { useState } from "react";

import "./App.scss";
import Dropdowns from "./components/Dropdowns";
import Entries from "./components/Entries";
import Header from "./components/Header";
import TabComponent from "./components/TabComponent";
import RegisterLicenseDialog from "./components/Dialog/RegisterLicense";

function App() {
  const [bRegisterLicense, setBRegisterLicense] = useState(false);

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
