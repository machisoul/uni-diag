import React from "react";
import FileInputRow from "../FileInputRow";
import { Fieldset } from "../ui";

const diagnosisRows = [
  {
    label: "通用诊断UDS",
    defaultValue: "10 03",
    file: "./conf/uds_test_file.txt",
    actionOptions: ["物理寻址"],
    buttonText: "发送"
  },
  {
    label: "诊断脚本文件浏览...",
    file: "./ota_package/",
    actionOptions: ["物理寻址", "APP+CAL"],
    buttonText: "开始"
  },
  {
    label: "UDS终检EOL浏览...",
    file: "./conf/eol_check_file.txt",
    actionOptions: ["下载线检"],
    buttonText: "开始"
  },
  {
    label: "标定流程规范浏览...",
    file: "",
    actionOptions: ["产线静态标定"],
    buttonText: "开始"
  },
  {
    label: "DTC配置文件浏览...",
    file: "./conf/dtc_mapping.csv",
    actionOptions: ["更新DTC"],
    buttonText: "开始"
  },
  {
    label: "OTA升级包浏览...",
    file: "./ota_package/all_in_one_full.zip",
    actionOptions: ["生成签名"],
    buttonText: "开始"
  }
];

const BasicDiagnosisPage: React.FC = () => {
  return (
    <div className="basic-diagnosis-page">
      <Fieldset legend="基础诊断操作">
        {diagnosisRows.map((row, idx) => (
          <FileInputRow key={idx} {...row} />
        ))}
      </Fieldset>
    </div>
  );
};

export default BasicDiagnosisPage;
