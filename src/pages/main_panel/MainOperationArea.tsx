import React, { useState } from "react";

// 导入各个操作页面组件
import BasicDiagnosisPage from "./basic_diag/BasicDiagnosisPage";
import FileFlashingPage from "./file_flashing/FileFlashingPage";

export type MenuTab = "basic" | "flashing" | "signature" | "transfer" | "fault";

export interface MainOperationAreaProps {
  className?: string;
  isConnected?: boolean;
}

const MainOperationArea: React.FC<MainOperationAreaProps> = ({
  className = "",
  isConnected = false
}) => {
  const [activeTab, setActiveTab] = useState<MenuTab>("basic");

  const menuItems = [
    { key: "basic" as MenuTab, label: "基础诊断" },
    { key: "flashing" as MenuTab, label: "文件刷写" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "basic":
        return <BasicDiagnosisPage isConnected={isConnected} />;
      case "flashing":
        return <FileFlashingPage />;
      default:
        return <BasicDiagnosisPage isConnected={isConnected} />;
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
