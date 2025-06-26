import React from "react";
import { Fieldset, FormRow, Input, Select, Button } from "../ui";
import type { SelectOption } from "../ui";

const transferModeOptions: SelectOption[] = [
  { value: "upload", label: "上传到ECU" },
  { value: "download", label: "从ECU下载" },
  { value: "bidirectional", label: "双向传输" }
];

const protocolOptions: SelectOption[] = [
  { value: "uds", label: "UDS协议" },
  { value: "kline", label: "K-Line" },
  { value: "can", label: "CAN总线" },
  { value: "ethernet", label: "以太网" }
];

const compressionOptions: SelectOption[] = [
  { value: "none", label: "无压缩" },
  { value: "gzip", label: "GZIP压缩" },
  { value: "lz4", label: "LZ4压缩" }
];

const FileTransferPage: React.FC = () => {
  return (
    <div className="file-transfer-page">
      <Fieldset legend="文件传输配置">
        <FormRow>
          <Select 
            label="传输模式"
            options={transferModeOptions}
            defaultValue="upload"
          />
          <Select 
            label="传输协议"
            options={protocolOptions}
            defaultValue="uds"
          />
        </FormRow>
        
        <FormRow>
          <Input 
            label="本地文件路径" 
            type="text" 
            placeholder="选择本地文件..."
          />
          <Button variant="secondary">浏览</Button>
        </FormRow>
        
        <FormRow>
          <Input 
            label="远程文件路径" 
            type="text" 
            placeholder="输入ECU中的文件路径..."
          />
        </FormRow>
        
        <FormRow>
          <Input 
            label="传输块大小" 
            type="text" 
            defaultValue="4096"
            placeholder="4096"
          />
          <Input 
            label="超时时间(ms)" 
            type="text" 
            defaultValue="10000"
            placeholder="10000"
          />
        </FormRow>
        
        <FormRow>
          <Select 
            label="压缩方式"
            options={compressionOptions}
            defaultValue="none"
          />
          <Input 
            label="重试次数" 
            type="text" 
            defaultValue="3"
            placeholder="3"
          />
        </FormRow>
        
        <FormRow>
          <Button>开始传输</Button>
          <Button variant="secondary">暂停</Button>
          <Button variant="danger">取消</Button>
          <Button variant="secondary">校验文件</Button>
        </FormRow>
      </Fieldset>
      
      <Fieldset legend="传输状态">
        <div className="transfer-status">
          <div className="status-row">
            <span>传输状态：</span>
            <span className="status-value">就绪</span>
          </div>
          <div className="status-row">
            <span>传输进度：</span>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "0%" }}></div>
              </div>
              <span className="progress-text">0%</span>
            </div>
          </div>
          <div className="status-row">
            <span>传输速度：</span>
            <span className="status-value">0 KB/s</span>
          </div>
          <div className="status-row">
            <span>剩余时间：</span>
            <span className="status-value">--:--</span>
          </div>
        </div>
      </Fieldset>
    </div>
  );
};

export default FileTransferPage;
