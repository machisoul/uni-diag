import React, { useState } from "react";
import { Button, Input, Select, FormRow } from "../../../components";
import type { SelectOption } from "../../../components";

export interface UdsService {
  serviceId: string;
  serviceName: string;
  defaultData: string;
  subServices: SelectOption[];
}

export interface UdsServiceRowProps {
  service: UdsService;
  onSend?: (serviceId: string, data: string, subService: string) => void;
}

const UdsServiceRow: React.FC<UdsServiceRowProps> = ({ service, onSend }) => {
  const [selectedSubService, setSelectedSubService] = useState(service.subServices[0]?.value || "");
  const [customData, setCustomData] = useState(service.defaultData);

  const handleSend = () => {
    console.log("UdsServiceRow handleSend clicked");
    console.log("onSend function:", onSend);
    console.log("service.serviceId:", service.serviceId);
    console.log("customData:", customData);
    console.log("selectedSubService:", selectedSubService);

    if (onSend) {
      console.log("Calling onSend function...");
      onSend(service.serviceId, customData, selectedSubService);
    } else {
      console.error("onSend function is not provided");
    }
  };

  const handleSubServiceChange = (value: string) => {
    setSelectedSubService(value);
    const subServiceHex = value.match(/\(([^)]+)\)/)?.[1] || "";
    if (subServiceHex) {
      const baseService = service.serviceId.replace("0x", "");
      setCustomData(`${baseService} ${subServiceHex}`);
    }
  };

  return (
    <div className="uds-service-row">
      <FormRow className="service-main-row">
        <div className="service-info">
          <div className="service-title">
            <span className="service-id">{service.serviceId}</span>
            <span className="service-name">{service.serviceName}</span>
          </div>
        </div>

        <Select
          label="子服务"
          options={service.subServices}
          value={selectedSubService}
          onChange={(e) => handleSubServiceChange(e.target.value)}
        />

        <Input
          label="数据"
          type="text"
          value={customData}
          onChange={(e) => setCustomData(e.target.value)}
          placeholder="输入十六进制数据"
        />

        <Button onClick={handleSend}>发送</Button>
      </FormRow>
    </div>
  );
};

export default UdsServiceRow;
