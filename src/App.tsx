import { useState } from "react";

import "./App.scss";
import Dropdowns from "./components/Dropdowns";
import Entries from "./components/Entries";
import Header from "./components/Header";
import TabComponent from "./components/TabComponent";
import RegisterLicenseModal from "./components/Modal/RegisterLicense";

function App() {
  const [bRegisterLicense, setBRegisterLicense] = useState(false);

  return (
    <div className="home">
      {
        bRegisterLicense &&
        <RegisterLicenseModal
          closeModal={() => setBRegisterLicense(false)}
          onSubmit={alert}
        />
      }
      <Header />
      <Dropdowns
        showModal={
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
