import React from "react";
import "./assets/styles/global.css";
import EcuConnectionPanel from "./components/EcuConnectionPanel";
import MainOperationArea from "./components/MainOperationArea";
import ActionLogPanel from "./components/ActionLogPanel";
import DiagMsgPanel from "./components/DiagMsgPanel";

const DiagApp: React.FC = () => (
  <div className="diag-app">
    <h1>UniDiag Client v1.0.0</h1>
    <EcuConnectionPanel />
    <MainOperationArea />
    <div className="log-section">
      <ActionLogPanel />
      <DiagMsgPanel />
    </div>
  </div>
);

export default DiagApp;