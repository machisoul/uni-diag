import React from "react";
import "./assets/styles/global.css";
import EcuConnectionPanel from "./components/EcuConnectionPanel";
import BasicDiagnosisPanel from "./components/BasicDiagnosisPanel";
import ActionLogPanel from "./components/ActionLogPanel";

const DiagApp: React.FC = () => (
  <div className="diag-app">
    <h1>大卓平台软件Diag客户端 - v3.0.3</h1>
    <EcuConnectionPanel />
    <BasicDiagnosisPanel />
    <div className="log-section">
      <ActionLogPanel />
    </div>
  </div>
);

export default DiagApp;