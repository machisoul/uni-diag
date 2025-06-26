import React from "react";

const ActionLogPanel: React.FC = () => {
  // 这里可以用 props 或 context 传递日志内容，先用静态内容
  return (
    <div className="action-log-panel">
      <fieldset>
        <legend>操作日志</legend>
        <div style={{ height: '100px', overflowY: 'auto', background: '#f5f5f5', padding: '8px' }}>
          <div>11:41:29 handleAction: start</div>
          <div>11:41:29 handleAction: wait</div>
        </div>
      </fieldset>
    </div>
  );
};

export default ActionLogPanel; 