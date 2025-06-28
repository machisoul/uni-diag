import React from "react";
import { Fieldset } from "../../components";

export interface LogEntry {
  timestamp: string;
  message: string;
}

export interface LogPanelProps {
  logs?: LogEntry[];
  height?: string;
}

const LogPanel: React.FC<LogPanelProps> = ({
  logs = [
    { timestamp: "11:41:29", message: "handleAction: start" },
    { timestamp: "11:41:29", message: "handleAction: wait" }
  ],
  height = "200px"
}) => {
  return (
    <div className="action-log-panel">
      <Fieldset legend="日志">
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

export default LogPanel; 