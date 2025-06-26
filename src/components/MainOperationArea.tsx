import React, { useState } from "react";

// 导入各个操作页面组件
import BasicDiagnosisPage from "./pages/BasicDiagnosisPage";
import FileFlashingPage from "./pages/FileFlashingPage";
import SignatureVerificationPage from "./pages/SignatureVerificationPage";
import FileTransferPage from "./pages/FileTransferPage";
import FaultAnalysisPage from "./pages/FaultAnalysisPage";

export type MenuTab = "basic" | "flashing" | "signature" | "transfer" | "fault";

export interface MainOperationAreaProps {
  className?: string;
}

const MainOperationArea: React.FC<MainOperationAreaProps> = ({ className = "" }) => {
  const [activeTab, setActiveTab] = useState<MenuTab>("basic");

  const menuItems = [
    { key: "basic" as MenuTab, label: "基础诊断" },
    { key: "flashing" as MenuTab, label: "文件刷写" },
    { key: "signature" as MenuTab, label: "加签验密" },
    { key: "transfer" as MenuTab, label: "文件传输" },
    { key: "fault" as MenuTab, label: "故障解析" }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "basic":
        return <BasicDiagnosisPage />;
      case "flashing":
        return <FileFlashingPage />;
      case "signature":
        return <SignatureVerificationPage />;
      case "transfer":
        return <FileTransferPage />;
      case "fault":
        return <FaultAnalysisPage />;
      default:
        return <BasicDiagnosisPage />;
    }
  };

  return (
    <div className={`main-operation-area ${className}`}>
      {/* 菜单标签 */}
      <div className="operation-tabs">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={`tab-button ${activeTab === item.key ? "active" : ""}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="operation-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainOperationArea;
