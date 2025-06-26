import React from "react";
import { Fieldset, FormRow, Input, Select, Button } from "../ui";
import type { SelectOption } from "../ui";

const algorithmOptions: SelectOption[] = [
  { value: "rsa2048", label: "RSA-2048" },
  { value: "rsa4096", label: "RSA-4096" },
  { value: "ecdsa256", label: "ECDSA-P256" },
  { value: "ecdsa384", label: "ECDSA-P384" }
];

const hashOptions: SelectOption[] = [
  { value: "sha256", label: "SHA-256" },
  { value: "sha384", label: "SHA-384" },
  { value: "sha512", label: "SHA-512" }
];

const operationOptions: SelectOption[] = [
  { value: "sign", label: "数字签名" },
  { value: "verify", label: "签名验证" },
  { value: "encrypt", label: "加密" },
  { value: "decrypt", label: "解密" }
];

const SignatureVerificationPage: React.FC = () => {
  return (
    <div className="signature-verification-page">
      <Fieldset legend="加签验密配置">
        <FormRow>
          <Select 
            label="操作类型"
            options={operationOptions}
            defaultValue="sign"
          />
          <Select 
            label="算法类型"
            options={algorithmOptions}
            defaultValue="rsa2048"
          />
        </FormRow>
        
        <FormRow>
          <Select 
            label="哈希算法"
            options={hashOptions}
            defaultValue="sha256"
          />
        </FormRow>
        
        <FormRow>
          <Input 
            label="源文件路径" 
            type="text" 
            placeholder="选择要处理的文件..."
          />
          <Button variant="secondary">浏览</Button>
        </FormRow>
        
        <FormRow>
          <Input 
            label="密钥文件路径" 
            type="text" 
            placeholder="选择密钥文件..."
          />
          <Button variant="secondary">浏览</Button>
        </FormRow>
        
        <FormRow>
          <Input 
            label="输出文件路径" 
            type="text" 
            placeholder="指定输出文件路径..."
          />
          <Button variant="secondary">浏览</Button>
        </FormRow>
        
        <FormRow>
          <Input 
            label="密钥密码" 
            type="password" 
            placeholder="输入密钥密码（如需要）"
          />
        </FormRow>
        
        <FormRow>
          <Button>执行操作</Button>
          <Button variant="secondary">验证结果</Button>
          <Button variant="secondary">生成密钥对</Button>
        </FormRow>
      </Fieldset>
      
      <Fieldset legend="操作结果">
        <div className="result-container">
          <div className="result-status">状态：等待操作</div>
          <div className="result-details">
            <textarea 
              className="result-text" 
              placeholder="操作结果将在此显示..."
              readOnly
              rows={6}
            />
          </div>
        </div>
      </Fieldset>
    </div>
  );
};

export default SignatureVerificationPage;
