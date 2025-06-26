import React, { useState, useCallback } from "react";
import { Button, Input, Fieldset, FormRow } from "../../components";
import { useUdsService } from "../../hooks/useUdsService";

export interface EcuConnectionPanelProps {
  onConnectionChange?: (isConnected: boolean) => void;
  onLog?: (message: string, type: 'info' | 'error' | 'success') => void;
}

const EcuConnectionPanel: React.FC<EcuConnectionPanelProps> = ({
  onConnectionChange,
  onLog
}) => {
  // 表单状态
  const [serverIp, setServerIp] = useState("192.168.2.56");
  const [port, setPort] = useState("13400");
  const [clientAddress, setClientAddress] = useState("0x0E80");
  const [serverAddress, setServerAddress] = useState("0x07C0");
  const [functionalAddress, setFunctionalAddress] = useState("0xE400");

  // UDS服务状态
  const [udsState, udsActions] = useUdsService();

  // 日志记录
  const logMessage = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    console.log(`[ECU连接] ${message}`);
    onLog?.(message, type);
  }, [onLog]);

  // 连接ECU
  const handleConnect = useCallback(async () => {
    try {
      logMessage("正在连接ECU...", 'info');

      const config = {
        ipAddress: serverIp,
        port: parseInt(port),
        serverAddress: serverAddress,
        clientAddress: clientAddress,
        timeout: 30000
      };

      const result = await udsActions.connect(config);

      if (result.success) {
        logMessage(`连接成功: ${result.message}`, 'success');
        onConnectionChange?.(true);
      } else {
        logMessage(`连接失败: ${result.message}`, 'error');
        onConnectionChange?.(false);
      }
    } catch (error) {
      logMessage(`连接异常: ${error}`, 'error');
      onConnectionChange?.(false);
    }
  }, [serverIp, port, serverAddress, clientAddress, udsActions, logMessage, onConnectionChange]);

  // 断开连接
  const handleDisconnect = useCallback(async () => {
    try {
      logMessage("正在断开连接...", 'info');

      const result = await udsActions.disconnect();

      if (result.success) {
        logMessage(`断开成功: ${result.message}`, 'success');
        onConnectionChange?.(false);
      } else {
        logMessage(`断开失败: ${result.message}`, 'error');
      }
    } catch (error) {
      logMessage(`断开异常: ${error}`, 'error');
    }
  }, [udsActions, logMessage, onConnectionChange]);

  // 会话保持
  const handleKeepSession = useCallback(async () => {
    try {
      if (!udsState.isConnected) {
        logMessage("未连接到ECU，无法执行会话保持", 'error');
        return;
      }

      logMessage("发送会话保持命令...", 'info');

      const result = await udsActions.sendCommand('0x3E', '3E 00');

      if (result.success) {
        logMessage("会话保持成功", 'success');
      } else {
        logMessage(`会话保持失败: ${result.message}`, 'error');
      }
    } catch (error) {
      logMessage(`会话保持异常: ${error}`, 'error');
    }
  }, [udsState.isConnected, udsActions, logMessage]);

  return (
    <div className="ecu-connection-panel">
      <Fieldset legend="ECU连接管理">
        <FormRow>
          <Input
            label="服务器IP"
            type="text"
            value={serverIp}
            onChange={(e) => setServerIp(e.target.value)}
            disabled={udsState.isConnected}
          />
          <Input
            label="端口"
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            disabled={udsState.isConnected}
          />
          <Input
            label="本端地址"
            type="text"
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            disabled={udsState.isConnected}
          />
          <Input
            label="目标地址"
            type="text"
            value={serverAddress}
            onChange={(e) => setServerAddress(e.target.value)}
            disabled={udsState.isConnected}
          />
          <Input
            label="功能地址"
            type="text"
            value={functionalAddress}
            onChange={(e) => setFunctionalAddress(e.target.value)}
            disabled={udsState.isConnected}
          />
        </FormRow>

        <FormRow>
          <Button
            onClick={handleConnect}
            disabled={udsState.isConnecting || udsState.isConnected}
          >
            {udsState.isConnecting ? '连接中...' : udsState.isConnected ? '已连接' : '连接'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDisconnect}
            disabled={!udsState.isConnected}
          >
            断开
          </Button>
          <Button
            variant="secondary"
            onClick={handleKeepSession}
            disabled={!udsState.isConnected}
          >
            会话保持
          </Button>
        </FormRow>

        {/* 连接状态指示 */}
        <FormRow>
          <div className="connection-status">
            <span className={`status-indicator ${udsState.isConnected ? 'connected' : 'disconnected'}`}>
              {udsState.isConnected ? '● 已连接' : '○ 未连接'}
            </span>
            {udsState.connectionConfig && (
              <span className="connection-info">
                {udsState.connectionConfig.ipAddress}:{udsState.connectionConfig.port}
              </span>
            )}
          </div>
        </FormRow>
      </Fieldset>
    </div>
  );
};

export default EcuConnectionPanel; 