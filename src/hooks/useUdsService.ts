/**
 * UDS服务React Hook
 * 提供在React组件中使用UDS诊断服务的便捷接口
 */

import { useState, useCallback, useRef } from 'react';
import { udsClientManager, DiagnosticResult, ConnectionConfig } from '../interface';

export interface UdsServiceState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionConfig: ConnectionConfig | null;
  lastResult: DiagnosticResult | null;
  logs: DiagnosticResult[];
}

export interface UdsServiceActions {
  connect: (config: ConnectionConfig) => Promise<DiagnosticResult>;
  disconnect: () => Promise<DiagnosticResult>;
  sendCommand: (serviceId: string, data: string) => Promise<DiagnosticResult>;
  clearLogs: () => void;
  getConnectionStatus: () => Promise<boolean>;
}

export function useUdsService(): [UdsServiceState, UdsServiceActions] {
  const [state, setState] = useState<UdsServiceState>({
    isConnected: false,
    isConnecting: false,
    connectionConfig: null,
    lastResult: null,
    logs: []
  });

  const logsRef = useRef<DiagnosticResult[]>([]);

  const addLog = useCallback((result: DiagnosticResult) => {
    logsRef.current = [...logsRef.current, result];
    setState(prev => ({
      ...prev,
      lastResult: result,
      logs: logsRef.current
    }));
  }, []);

  const connect = useCallback(async (config: ConnectionConfig): Promise<DiagnosticResult> => {
    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const result = await udsClientManager.connect(config);

      setState(prev => ({
        ...prev,
        isConnected: result.success,
        isConnecting: false,
        connectionConfig: result.success ? config : null
      }));

      addLog(result);
      return result;
    } catch (error) {
      const errorResult: DiagnosticResult = {
        success: false,
        message: `连接失败: ${error}`,
        timestamp: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionConfig: null
      }));

      addLog(errorResult);
      return errorResult;
    }
  }, [addLog]);

  const disconnect = useCallback(async (): Promise<DiagnosticResult> => {
    try {
      const result = await udsClientManager.disconnect();

      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionConfig: null
      }));

      addLog(result);
      return result;
    } catch (error) {
      const errorResult: DiagnosticResult = {
        success: false,
        message: `断开连接失败: ${error}`,
        timestamp: new Date().toISOString()
      };

      addLog(errorResult);
      return errorResult;
    }
  }, [addLog]);

  const sendCommand = useCallback(async (serviceId: string, data: string): Promise<DiagnosticResult> => {
    if (!state.isConnected) {
      const errorResult: DiagnosticResult = {
        success: false,
        message: '未连接到ECU，请先建立连接',
        timestamp: new Date().toISOString()
      };

      addLog(errorResult);
      return errorResult;
    }

    try {
      const result = await udsClientManager.sendUdsCommand(serviceId, data);
      addLog(result);
      return result;
    } catch (error) {
      const errorResult: DiagnosticResult = {
        success: false,
        message: `命令执行失败: ${error}`,
        timestamp: new Date().toISOString()
      };

      addLog(errorResult);
      return errorResult;
    }
  }, [state.isConnected, addLog]);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setState(prev => ({
      ...prev,
      logs: [],
      lastResult: null
    }));
  }, []);

  const getConnectionStatus = useCallback(async (): Promise<boolean> => {
    return await udsClientManager.getConnectionStatusAsync();
  }, []);

  const actions: UdsServiceActions = {
    connect,
    disconnect,
    sendCommand,
    clearLogs,
    getConnectionStatus
  };

  return [state, actions];
}

export const UDS_COMMAND_TEMPLATES = {
  DEFAULT_SESSION: { serviceId: '0x10', data: '10 01', description: '默认会话' },
  PROGRAMMING_SESSION: { serviceId: '0x10', data: '10 02', description: '编程会话' },
  EXTENDED_SESSION: { serviceId: '0x10', data: '10 03', description: '扩展会话' },

  HARD_RESET: { serviceId: '0x11', data: '11 01', description: '硬重启' },
  SOFT_RESET: { serviceId: '0x11', data: '11 02', description: '软重启' },

  CLEAR_ALL_DTC: { serviceId: '0x14', data: '14 FF FF FF', description: '清除所有DTC' },

  READ_CURRENT_DTC: { serviceId: '0x19', data: '19 02 AF', description: '读取当前DTC' },
  READ_HISTORY_DTC: { serviceId: '0x19', data: '19 08 AF', description: '读取历史DTC' },

  READ_VIN: { serviceId: '0x22', data: '22 F1 90', description: '读取VIN码' },
  READ_SOFTWARE_VERSION: { serviceId: '0x22', data: '22 F1 94', description: '读取软件版本' },
  READ_HARDWARE_VERSION: { serviceId: '0x22', data: '22 F1 91', description: '读取硬件版本' },

  SECURITY_SEED_LEVEL1: { serviceId: '0x27', data: '27 01', description: '安全访问种子Level1' },
  SECURITY_KEY_LEVEL1: { serviceId: '0x27', data: '27 02', description: '安全访问密钥Level1' },

  ENABLE_COMMUNICATION: { serviceId: '0x28', data: '28 00 01', description: '使能通信' },
  DISABLE_COMMUNICATION: { serviceId: '0x28', data: '28 01 01', description: '禁用通信' },

  TESTER_PRESENT: { serviceId: '0x3E', data: '3E 00', description: '测试器在线' },
  TESTER_PRESENT_NO_RESPONSE: { serviceId: '0x3E', data: '3E 80', description: '测试器在线(无响应)' },

  ENABLE_DTC: { serviceId: '0x85', data: '85 02', description: '使能DTC' },
  DISABLE_DTC: { serviceId: '0x85', data: '85 01', description: '禁用DTC' }
} as const;
