import React from "react";
import { Fieldset } from "./ui";

export interface LogEntry {
  timestamp: string;
  message: string;
}

export interface ActionLogPanelProps {
  logs?: LogEntry[];
  height?: string;
}

const ActionLogPanel: React.FC<ActionLogPanelProps> = ({
  logs = [
    { timestamp: "11:41:29", message: "handleAction: start" },
    { timestamp: "11:41:29", message: "handleAction: wait" }
  ],
  height = "200px"
}) => {
  return (
    <div className="action-log-panel">
      <Fieldset legend="操作日志">
        <div
          className="log-content action-log-content"
          style={{
            height,
            overflowY: 'auto',
            background: '#f5f5f5',
            padding: '8px',
            borderRadius: '4px'
          }}
        >
          {logs.map((log, index) => (
            <div key={index} className="log-entry action-log-entry">
              <span className="log-timestamp">{log.timestamp}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      </Fieldset>
    </div>
  );
};

export default ActionLogPanel; 