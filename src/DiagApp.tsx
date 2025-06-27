import React, { useState, useCallback } from "react";
import "./assets/styles/global.css";
import EcuConnectionPanel from "./pages/uds_connection/EcuConnectionPanel";
import MainOperationArea from "./pages/main_panel/MainOperationArea";
import { LogEntry } from "./pages/log_msg/ActionLogPanel";
import ActionLogPanel from "./pages/log_msg/ActionLogPanel";
import { DiagnosticMessage } from "./pages/log_msg/DiagMsgPanel"
import DiagMsgPanel from "./pages/log_msg/DiagMsgPanel";

const DiagApp: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [actionLogs, setActionLogs] = useState<LogEntry[]>([
    { timestamp: "11:41:29", message: "应用程序启动" }
  ]);
  const [diagnosticMessages, setDiagnosticMessages] = useState<DiagnosticMessage[]>([
    { timestamp: "11:41:30", type: "info", message: "系统初始化完成" }
  ]);

  // 处理连接状态变化
  const handleConnectionChange = useCallback((connected: boolean) => {
    console.log("DiagApp: Connection state changed to:", connected);
    setIsConnected(connected);

    const timestamp = new Date().toLocaleTimeString();
    const message = connected ? "ECU连接已建立" : "ECU连接已断开";

    setActionLogs(prev => [...prev, { timestamp, message }]);
    setDiagnosticMessages(prev => [...prev, {
      timestamp,
      type: connected ? "success" : "info",
      message
    }]);
  }, []);

  // 处理日志消息
  const handleLog = useCallback((message: string, type: 'info' | 'error' | 'success') => {
    const timestamp = new Date().toLocaleTimeString();

    // 添加到操作日志
    setActionLogs(prev => [...prev, { timestamp, message }]);

    // 添加到诊断消息日志
    const diagType: DiagnosticMessage['type'] = type === 'error' ? 'error' :
      type === 'success' ? 'success' : 'info';
    setDiagnosticMessages(prev => [...prev, {
      timestamp,
      type: diagType,
      message
    }]);
  }, []);

  return (
    <div className="diag-app">
      <h1>UniDiag Client v1.0.0</h1>

      <EcuConnectionPanel
        onConnectionChange={handleConnectionChange}
        onLog={handleLog}
      />

      <MainOperationArea isConnected={isConnected} />

      <div className="log-section">
        <ActionLogPanel logs={actionLogs} />
        <DiagMsgPanel messages={diagnosticMessages} />
      </div>
    </div>
  );
};

export default DiagApp;