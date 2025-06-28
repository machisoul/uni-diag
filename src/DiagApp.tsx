import React, { useState, useCallback } from "react";
import "./assets/styles/global.css";
import EcuConnectionPanel from "./pages/uds_connection/EcuConnectionPanel";
import MainOperationArea from "./pages/main_panel/MainOperationArea";
import { LogEntry } from "./pages/log_msg/LogPanel";
import LogPanel from "./pages/log_msg/LogPanel";

const DiagApp: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [systemLogs, setLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toLocaleTimeString(), message: "应用程序启动" }
  ]);

  // 处理连接状态变化
  const handleConnectionChange = useCallback((connected: boolean) => {
    console.log("DiagApp: Connection state changed to:", connected);
    setIsConnected(connected);

    const timestamp = new Date().toLocaleTimeString();
    const message = connected ? "ECU连接已建立" : "ECU连接已断开";

    setLogs(prev => [...prev, { timestamp, message }]);
  }, []);

  // 处理日志消息
  const handleLog = useCallback((message: string, type: 'info' | 'error' | 'success') => {
    const timestamp = new Date().toLocaleTimeString();

    // 添加到操作日志
    setLogs(prev => [...prev, { timestamp, message }]);
  }, []);

  return (
    <div className="diag-app">
      <h1>UniDiag Client v1.0.0</h1>

      <EcuConnectionPanel
        onConnectionChange={handleConnectionChange}
        onLog={handleLog}
      />

      <MainOperationArea isConnected={isConnected} />

      <LogPanel logs={systemLogs} />
    </div>
  );
};

export default DiagApp;