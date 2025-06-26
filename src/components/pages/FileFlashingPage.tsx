import React from "react";
import { Fieldset, FormRow, Input, Select, Button } from "../ui";
import type { SelectOption } from "../ui";

const flashingModeOptions: SelectOption[] = [
  { value: "full", label: "完整刷写" },
  { value: "partial", label: "部分刷写" },
  { value: "differential", label: "差分刷写" }
];

const targetOptions: SelectOption[] = [
  { value: "app", label: "应用程序" },
  { value: "bootloader", label: "引导程序" },
  { value: "calibration", label: "标定数据" },
  { value: "all", label: "全部" }
];

const FileFlashingPage: React.FC = () => {
  return (
    <div className="file-flashing-page">
      <Fieldset legend="文件刷写配置">
        <FormRow>
          <Input 
            label="刷写文件路径" 
            type="text" 
            placeholder="选择要刷写的文件..."
          />
          <Button variant="secondary">浏览</Button>
        </FormRow>
        
        <FormRow>
          <Select 
            label="刷写模式"
            options={flashingModeOptions}
            defaultValue="full"
          />
          <Select 
            label="目标区域"
            options={targetOptions}
            defaultValue="app"
          />
        </FormRow>
        
        <FormRow>
          <Input 
            label="起始地址" 
            type="text" 
            defaultValue="0x8000"
            placeholder="0x8000"
          />
          <Input 
            label="结束地址" 
            type="text" 
            defaultValue="0x80000"
            placeholder="0x80000"
          />
        </FormRow>
        
        <FormRow>
          <Input 
            label="块大小" 
            type="text" 
            defaultValue="1024"
            placeholder="1024"
          />
          <Input 
            label="超时时间(ms)" 
            type="text" 
            defaultValue="5000"
            placeholder="5000"
          />
        </FormRow>
        
        <FormRow>
          <Button>开始刷写</Button>
          <Button variant="secondary">暂停</Button>
          <Button variant="danger">停止</Button>
          <Button variant="secondary">验证</Button>
        </FormRow>
      </Fieldset>
      
      <Fieldset legend="刷写进度">
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "0%" }}></div>
          </div>
          <div className="progress-text">准备就绪 - 0%</div>
        </div>
      </Fieldset>
    </div>
  );
};

export default FileFlashingPage;
