import React from "react";
import { Button, Input, Fieldset, FormRow } from "./ui";

const EcuConnectionPanel: React.FC = () => {
  return (
    <div className="ecu-connection-panel">
      <Fieldset legend="ECU连接管理">
        <FormRow>
          <Input label="服务器IP" type="text" defaultValue="192.168.2.56" />
          <Input label="端口" type="text" defaultValue="13400" />
          <Input label="本端地址" type="text" defaultValue="0x0E80" />
          <Input label="目标地址" type="text" defaultValue="0x07C0" />
          <Input label="功能地址" type="text" defaultValue="0xE400" />
        </FormRow>

        <FormRow>
          <Button>连接</Button>
          <Button variant="secondary">断开</Button>
          <Button variant="secondary">会话保持</Button>
        </FormRow>
      </Fieldset>
    </div>
  );
};

export default EcuConnectionPanel; 