import React from "react";
import { Fieldset } from "../../components";

export interface DiagnosticMessage {
  timestamp: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
}

export interface DiagMsgPanelProps {
  messages?: DiagnosticMessage[];
  height?: string;
}

const DiagMsgPanel: React.FC<DiagMsgPanelProps> = ({
  messages = [
    { timestamp: "11:41:30", type: "info", message: "连接ECU成功" },
    { timestamp: "11:41:31", type: "success", message: "诊断数据读取完成" },
    { timestamp: "11:41:32", type: "warning", message: "检测到故障码 P0001" },
    { timestamp: "11:41:33", type: "error", message: "通信超时" }
  ],
  height = "200px"
}) => {
  return (
    <div className="diag-msg-panel">
      <Fieldset legend="诊断消息日志">
        <div
          className="log-content diagnostic-log-content"
          style={{
            height,
            overflowY: 'auto',
            background: '#f5f5f5',
            padding: '8px',
            borderRadius: '4px'
          }}
        >
          {messages.map((msg, index) => (
            <div key={index} className={`log-entry diagnostic-log-entry diagnostic-${msg.type}`}>
              <span className="log-timestamp">{msg.timestamp}</span>
              <span className="log-type">[{msg.type.toUpperCase()}]</span>
              <span className="log-message">{msg.message}</span>
            </div>
          ))}
        </div>
      </Fieldset>
    </div>
  );
};

export default DiagMsgPanel;
