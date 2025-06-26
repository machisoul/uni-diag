import React from "react";
import { Fieldset, FormRow, Input, Select, Button } from "../ui";
import type { SelectOption } from "../ui";

const analysisTypeOptions: SelectOption[] = [
  { value: "dtc", label: "DTC故障码分析" },
  { value: "freeze", label: "冻结帧分析" },
  { value: "live", label: "实时数据分析" },
  { value: "history", label: "历史故障分析" }
];

const severityOptions: SelectOption[] = [
  { value: "all", label: "全部" },
  { value: "critical", label: "严重" },
  { value: "warning", label: "警告" },
  { value: "info", label: "信息" }
];

// 模拟故障数据
const mockFaults = [
  { code: "P0001", description: "燃油量控制器A电路/开路", severity: "critical", status: "当前" },
  { code: "P0002", description: "燃油量控制器A电路范围/性能", severity: "warning", status: "历史" },
  { code: "P0003", description: "燃油量控制器A电路低", severity: "warning", status: "当前" },
  { code: "B0001", description: "驾驶员安全气囊电路故障", severity: "critical", status: "历史" }
];

const FaultAnalysisPage: React.FC = () => {
  return (
    <div className="fault-analysis-page">
      <Fieldset legend="故障分析配置">
        <FormRow>
          <Select 
            label="分析类型"
            options={analysisTypeOptions}
            defaultValue="dtc"
          />
          <Select 
            label="严重程度"
            options={severityOptions}
            defaultValue="all"
          />
        </FormRow>
        
        <FormRow>
          <Input 
            label="故障码过滤" 
            type="text" 
            placeholder="输入故障码进行过滤，如P0001"
          />
          <Button variant="secondary">过滤</Button>
        </FormRow>
        
        <FormRow>
          <Input 
            label="DTC配置文件" 
            type="text" 
            defaultValue="./conf/dtc_mapping.csv"
          />
          <Button variant="secondary">浏览</Button>
        </FormRow>
        
        <FormRow>
          <Button>读取故障码</Button>
          <Button variant="secondary">清除故障码</Button>
          <Button variant="secondary">导出报告</Button>
          <Button variant="secondary">刷新</Button>
        </FormRow>
      </Fieldset>
      
      <Fieldset legend="故障码列表">
        <div className="fault-list">
          <div className="fault-header">
            <div className="fault-col">故障码</div>
            <div className="fault-col">描述</div>
            <div className="fault-col">严重程度</div>
            <div className="fault-col">状态</div>
            <div className="fault-col">操作</div>
          </div>
          {mockFaults.map((fault, index) => (
            <div key={index} className={`fault-row fault-${fault.severity}`}>
              <div className="fault-col">{fault.code}</div>
              <div className="fault-col">{fault.description}</div>
              <div className="fault-col">
                <span className={`severity-badge severity-${fault.severity}`}>
                  {fault.severity === 'critical' ? '严重' : 
                   fault.severity === 'warning' ? '警告' : '信息'}
                </span>
              </div>
              <div className="fault-col">
                <span className={`status-badge status-${fault.status === '当前' ? 'current' : 'history'}`}>
                  {fault.status}
                </span>
              </div>
              <div className="fault-col">
                <Button size="small" variant="secondary">详情</Button>
              </div>
            </div>
          ))}
        </div>
      </Fieldset>
      
      <Fieldset legend="故障统计">
        <div className="fault-statistics">
          <div className="stat-item">
            <span className="stat-label">总故障数：</span>
            <span className="stat-value">4</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">严重故障：</span>
            <span className="stat-value critical">2</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">警告故障：</span>
            <span className="stat-value warning">2</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">当前故障：</span>
            <span className="stat-value">2</span>
          </div>
        </div>
      </Fieldset>
    </div>
  );
};

export default FaultAnalysisPage;
