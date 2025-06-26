import React from "react";

const EcuConnectionPanel: React.FC = () => {
  return (
    <div className="ecu-connection-panel">
      <fieldset>
        <legend>ECU连接管理</legend>
        <div className="row">
          <label>选择ECU
            <select>
              <option>J6E(T28)</option>
              {/* 其他选项 */}
            </select>
          </label>
          <label>
            <select>
              <option>DOIP</option>
              {/* 其他选项 */}
            </select>
          </label>
          <button>连接</button>
          <button>断开</button>
          <button>保存配置</button>
          <button>会话保持</button>
        </div>
        <div className="row">
          <label>服务器IP <input type="text" defaultValue="192.168.2.56" /></label>
          <label>端口 <input type="text" defaultValue="13400" /></label>
          <label>本端地址 <input type="text" defaultValue="0x0E80" /></label>
          <label>目标地址 <input type="text" defaultValue="0x07C0" /></label>
          <label>功能地址 <input type="text" defaultValue="0xE400" /></label>
        </div>
        <div className="row">
          <label>CAN通道 <input type="text" defaultValue="can0" /></label>
          <label>CAN类型 <input type="text" defaultValue="CAN-FD" /></label>
          <label>CAN请求标识 <input type="text" defaultValue="0x7C0" /></label>
          <label>CAN应答标识 <input type="text" defaultValue="0x7D0" /></label>
          <label>CAN功能寻址 <input type="text" defaultValue="0x7DF" /></label>
        </div>
      </fieldset>
    </div>
  );
};

export default EcuConnectionPanel; 