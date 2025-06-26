import React from "react";
import UdsServiceRow from "./UdsServiceRow";
import { useUdsService } from "../../../hooks/useUdsService";
import type { UdsService } from "./UdsServiceRow";
import Fieldset from "../../../components/Fieldset"

const udsServices: UdsService[] = [
  // 0x10: 会话控制 (Diagnostic Session Control)
  {
    serviceId: "0x10",
    serviceName: "会话控制",
    defaultData: "10 01",
    subServices: [
      { value: "默认会话(01)", label: "默认会话(01)" },
      { value: "编程会话(02)", label: "编程会话(02)" },
      { value: "扩展会话(03)", label: "扩展会话(03)" }
    ]
  },
  // 0x11: 重启 (ECU Reset)
  {
    serviceId: "0x11",
    serviceName: "ECU重启",
    defaultData: "11 01",
    subServices: [
      { value: "硬重启(01)", label: "硬重启(01)" },
      { value: "软重启(02)", label: "软重启(02)" },
      { value: "快速重启(03)", label: "快速重启(03)" }
    ]
  },
  // 0x14: 清除DTC (Clear Diagnostic Information)
  {
    serviceId: "0x14",
    serviceName: "清除DTC",
    defaultData: "14 FF FF FF",
    subServices: [
      { value: "清除所有DTC(FFFFFF)", label: "清除所有DTC" },
      { value: "清除特定DTC", label: "清除特定DTC" }
    ]
  },
  // 0x19: 读DTC信息 (Read DTC Information)
  {
    serviceId: "0x19",
    serviceName: "读DTC信息",
    defaultData: "19 02 AF",
    subServices: [
      { value: "读当前DTC(02)", label: "读当前DTC(02)" },
      { value: "读历史DTC(08)", label: "读历史DTC(08)" },
      { value: "读冻结帧(04)", label: "读冻结帧(04)" },
      { value: "读DTC快照(03)", label: "读DTC快照(03)" }
    ]
  },
  // 0x22: 读标识数据 (Read Data By Identifier)
  {
    serviceId: "0x22",
    serviceName: "读标识数据",
    defaultData: "22 F1 90",
    subServices: [
      { value: "VIN码(F190)", label: "VIN码(F190)" },
      { value: "软件版本(F194)", label: "软件版本(F194)" },
      { value: "硬件版本(F191)", label: "硬件版本(F191)" },
      { value: "标定版本(F195)", label: "标定版本(F195)" }
    ]
  },
  // 0x27: 安全访问 (Security Access)
  {
    serviceId: "0x27",
    serviceName: "安全访问",
    defaultData: "27 01",
    subServices: [
      { value: "请求种子Level1(01)", label: "请求种子Level1(01)" },
      { value: "发送密钥Level1(02)", label: "发送密钥Level1(02)" },
      { value: "请求种子Level2(03)", label: "请求种子Level2(03)" },
      { value: "发送密钥Level2(04)", label: "发送密钥Level2(04)" }
    ]
  },
  // 0x28: 通信控制 (Communication Control)
  {
    serviceId: "0x28",
    serviceName: "通信控制",
    defaultData: "28 00 01",
    subServices: [
      { value: "使能通信(00)", label: "使能通信(00)" },
      { value: "禁用通信(01)", label: "禁用通信(01)" },
      { value: "使能发送(02)", label: "使能发送(02)" },
      { value: "禁用发送(03)", label: "禁用发送(03)" }
    ]
  },
  // 0x2E: 写标识数据 (Write Data By Identifier)
  {
    serviceId: "0x2E",
    serviceName: "写标识数据",
    defaultData: "2E F1 90",
    subServices: [
      { value: "写VIN码(F190)", label: "写VIN码(F190)" },
      { value: "写配置数据", label: "写配置数据" },
      { value: "写标定数据", label: "写标定数据" }
    ]
  },
  // 0x31: 例程控制 (Routine Control)
  {
    serviceId: "0x31",
    serviceName: "例程控制",
    defaultData: "31 01 FF 00",
    subServices: [
      { value: "启动例程(01)", label: "启动例程(01)" },
      { value: "停止例程(02)", label: "停止例程(02)" },
      { value: "请求结果(03)", label: "请求结果(03)" }
    ]
  },
  // 0x3E: 会话保持 (Tester Present)
  {
    serviceId: "0x3E",
    serviceName: "会话保持",
    defaultData: "3E 00",
    subServices: [
      { value: "保持会话(00)", label: "保持会话(00)" },
      { value: "抑制响应(80)", label: "抑制响应(80)" }
    ]
  },
  // 0x85: DTC使能 (Control DTC Setting)
  {
    serviceId: "0x85",
    serviceName: "DTC控制",
    defaultData: "85 02",
    subServices: [
      { value: "使能DTC(02)", label: "使能DTC(02)" },
      { value: "禁用DTC(01)", label: "禁用DTC(01)" }
    ]
  }
];

const BasicDiagnosisPage: React.FC = () => {
  const [udsState, udsActions] = useUdsService();

  const handleSendUdsCommand = async (serviceId: string, data: string, subService: string) => {
    console.log(`发送UDS命令: ${serviceId}, 数据: ${data}, 子服务: ${subService}`);

    if (!udsState.isConnected) {
      console.error('未连接到ECU，无法发送命令');
      return;
    }

    try {
      const result = await udsActions.sendCommand(serviceId, data);

      if (result.success) {
        console.log(`UDS命令执行成功: ${result.message}`);
      } else {
        console.error(`UDS命令执行失败: ${result.message}`);
      }
    } catch (error) {
      console.error(`UDS命令执行异常: ${error}`);
    }
  };

  return (
    <div className="basic-diagnosis-page">
      <Fieldset legend="UDS诊断服务">
        {udsServices.map((service, idx) => (
          <UdsServiceRow
            key={idx}
            service={service}
            onSend={handleSendUdsCommand}
          />
        ))}
      </Fieldset>
    </div>
  );
};

export default BasicDiagnosisPage;
