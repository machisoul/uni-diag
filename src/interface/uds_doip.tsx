/**
 * UDS DoIP 前端接口
 * 将 Rust 实现的 DoIP 和 UDS 功能导出到前端
 */

import { invoke } from "@tauri-apps/api/core";

// 类型定义
export interface ConnectionConfig {
  ip_address: string;
  port: number;
  server_address: string;
  client_address: string;
  timeout?: number;
}

export interface DiagnosticResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;
}

export interface PingResult {
  success: boolean;
  host: string;
  ip?: string;
  time_ms?: number;
  error?: string;
  method: string;
}

// UDS 服务 ID 常量
export const UDS_SERVICES = {
  DIAGNOSTIC_SESSION_CONTROL: 0x10,
  ECU_RESET: 0x11,
  CLEAR_DIAGNOSTIC_INFORMATION: 0x14,
  READ_DTC_INFORMATION: 0x19,
  READ_DATA_BY_IDENTIFIER: 0x22,
  SECURITY_ACCESS: 0x27,
  COMMUNICATION_CONTROL: 0x28,
  WRITE_DATA_BY_IDENTIFIER: 0x2E,
  ROUTINE_CONTROL: 0x31,
  TESTER_PRESENT: 0x3E,
  CONTROL_DTC_SETTING: 0x85
} as const;

// 常用 DID（数据标识符）常量
export const COMMON_DIDS = {
  VIN: 0xF190,
  HARDWARE_VERSION: 0xF191,
  SOFTWARE_VERSION: 0xF194,
  CALIBRATION_VERSION: 0xF195,
  ECU_SERIAL_NUMBER: 0xF18C,
  ECU_MANUFACTURING_DATE: 0xF18A,
  ECU_INSTALLATION_DATE: 0xF18B
} as const;

// 会话类型常量
export const SESSION_TYPES = {
  DEFAULT: 0x01,
  PROGRAMMING: 0x02,
  EXTENDED: 0x03
} as const;

// 重启类型常量
export const RESET_TYPES = {
  HARD_RESET: 0x01,
  KEY_OFF_ON_RESET: 0x02,
  SOFT_RESET: 0x03
} as const;

// 安全访问级别常量
export const SECURITY_LEVELS = {
  LEVEL1_SEED: 0x01,
  LEVEL1_KEY: 0x02,
  LEVEL2_SEED: 0x03,
  LEVEL2_KEY: 0x04,
  LEVEL3_SEED: 0x05,
  LEVEL3_KEY: 0x06,
  LEVEL4_SEED: 0x07,
  LEVEL4_KEY: 0x08
} as const;

// DTC 状态掩码常量
export const DTC_STATUS_MASK = {
  TEST_FAILED: 0x01,
  TEST_FAILED_THIS_OPERATION_CYCLE: 0x02,
  PENDING_DTC: 0x04,
  CONFIRMED_DTC: 0x08,
  TEST_NOT_COMPLETED_SINCE_LAST_CLEAR: 0x10,
  TEST_FAILED_SINCE_LAST_CLEAR: 0x20,
  TEST_NOT_COMPLETED_THIS_OPERATION_CYCLE: 0x40,
  WARNING_INDICATOR_REQUESTED: 0x80
} as const;

/**
 * UDS 客户端管理器类
 * 封装 Tauri 命令调用，提供与 TypeScript 版本兼容的接口
 */
export class UdsClientManager {
  /**
   * 连接到 ECU
   */
  async connect(config: ConnectionConfig): Promise<DiagnosticResult> {
    try {
      return await invoke<DiagnosticResult>('connect_ecu', { config });
    } catch (error) {
      return {
        success: false,
        message: `连接失败: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 断开 ECU 连接
   */
  async disconnect(): Promise<DiagnosticResult> {
    try {
      return await invoke<DiagnosticResult>('disconnect_ecu');
    } catch (error) {
      return {
        success: false,
        message: `断开连接失败: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取连接状态（异步版本）
   */
  async getConnectionStatusAsync(): Promise<boolean> {
    try {
      return await invoke<boolean>('get_connection_status');
    } catch (error) {
      console.error('获取连接状态失败:', error);
      return false;
    }
  }

  /**
   * 发送 UDS 命令
   */
  async sendUdsCommand(serviceId: string, data: string): Promise<DiagnosticResult> {
    try {
      return await invoke<DiagnosticResult>('send_uds_command', {
        serviceId,
        data
      });
    } catch (error) {
      return {
        success: false,
        message: `命令执行失败: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取连接配置
   */
  async getConnectionConfig(): Promise<ConnectionConfig | null> {
    try {
      return await invoke<ConnectionConfig | null>('get_connection_config');
    } catch (error) {
      console.error('获取连接配置失败:', error);
      return null;
    }
  }

  /**
   * Ping 主机
   */
  async pingHost(host: string): Promise<PingResult> {
    try {
      return await invoke<PingResult>('ping_host', { host });
    } catch (error) {
      return {
        success: false,
        host,
        error: `Ping失败: ${error}`,
        method: 'error'
      };
    }
  }

  /**
   * 测试安全访问算法
   */
  async testSecurityAccess(): Promise<string> {
    try {
      return await invoke<string>('test_security_access');
    } catch (error) {
      return `测试失败: ${error}`;
    }
  }

  // 兼容性方法，保持与原 TypeScript 版本的接口一致
  getConnectionStatus(): boolean {
    // 注意：这是同步方法，但实际的 Tauri 调用是异步的
    // 在实际使用中，建议使用异步版本
    console.warn('getConnectionStatus() 是同步方法，建议使用 getConnectionStatus() 的异步版本');
    return false;
  }
}

// 创建全局实例
export const udsClientManager = new UdsClientManager();

// 便捷函数
export const connectEcu = (config: ConnectionConfig) => udsClientManager.connect(config);
export const disconnectEcu = () => udsClientManager.disconnect();
export const sendUdsCommand = (serviceId: string, data: string) => udsClientManager.sendUdsCommand(serviceId, data);
export const getConnectionStatus = () => udsClientManager.getConnectionStatus();
export const getConnectionConfig = () => udsClientManager.getConnectionConfig();
export const pingHost = (host: string) => udsClientManager.pingHost(host);

// 工具函数
export const hexToBytes = (hex: string): Uint8Array => {
  const cleanHex = hex.replace(/\s+/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
};

export const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join(' ');
};

export const printHex = (data: Uint8Array, bytesPerLine: number = 32): void => {
  for (let i = 0; i < data.length; i += bytesPerLine) {
    const chunk = data.slice(i, i + bytesPerLine);
    const hexStr = Array.from(chunk)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(' ');
    console.log(`0x${i.toString(16).padStart(4, '0')}: ${hexStr}`);
  }
};

// UDS 命令模板（与原版本兼容）
export const UDS_COMMAND_TEMPLATES = {
  DEFAULT_SESSION: { serviceId: '0x10', data: '10 01', description: '默认会话' },
  PROGRAMMING_SESSION: { serviceId: '0x10', data: '10 02', description: '编程会话' },
  EXTENDED_SESSION: { serviceId: '0x10', data: '10 03', description: '扩展会话' },

  HARD_RESET: { serviceId: '0x11', data: '11 01', description: '硬重启' },
  SOFT_RESET: { serviceId: '0x11', data: '11 02', description: '软重启' },
  KEY_OFF_ON_RESET: { serviceId: '0x11', data: '11 03', description: '钥匙关闭重启' },

  CLEAR_ALL_DTC: { serviceId: '0x14', data: '14 FF FF FF', description: '清除所有DTC' },

  READ_CURRENT_DTC: { serviceId: '0x19', data: '19 02 AF', description: '读取当前DTC' },
  READ_HISTORY_DTC: { serviceId: '0x19', data: '19 08 AF', description: '读取历史DTC' },
  READ_PENDING_DTC: { serviceId: '0x19', data: '19 04 AF', description: '读取待定DTC' },

  READ_VIN: { serviceId: '0x22', data: '22 F1 90', description: '读取VIN码' },
  READ_SOFTWARE_VERSION: { serviceId: '0x22', data: '22 F1 94', description: '读取软件版本' },
  READ_HARDWARE_VERSION: { serviceId: '0x22', data: '22 F1 91', description: '读取硬件版本' },
  READ_CALIBRATION_VERSION: { serviceId: '0x22', data: '22 F1 95', description: '读取标定版本' },
  READ_ECU_SERIAL_NUMBER: { serviceId: '0x22', data: '22 F1 8C', description: '读取ECU序列号' },

  SECURITY_SEED_LEVEL1: { serviceId: '0x27', data: '27 01', description: '安全访问种子Level1' },
  SECURITY_KEY_LEVEL1: { serviceId: '0x27', data: '27 02', description: '安全访问密钥Level1' },
  SECURITY_SEED_LEVEL2: { serviceId: '0x27', data: '27 03', description: '安全访问种子Level2' },
  SECURITY_KEY_LEVEL2: { serviceId: '0x27', data: '27 04', description: '安全访问密钥Level2' },

  ENABLE_COMMUNICATION: { serviceId: '0x28', data: '28 00 03', description: '使能通信' },
  DISABLE_COMMUNICATION: { serviceId: '0x28', data: '28 01 03', description: '禁用通信' },

  TESTER_PRESENT: { serviceId: '0x3E', data: '3E 00', description: '测试器在线' },
  TESTER_PRESENT_NO_RESPONSE: { serviceId: '0x3E', data: '3E 80', description: '测试器在线(无响应)' },

  ENABLE_DTC: { serviceId: '0x85', data: '85 02', description: '使能DTC' },
  DISABLE_DTC: { serviceId: '0x85', data: '85 01', description: '禁用DTC' }
} as const;

// 类型已在上面导出，这里不需要重复导出

// 默认导出
export default {
  UdsClientManager,
  udsClientManager,
  UDS_SERVICES,
  COMMON_DIDS,
  SESSION_TYPES,
  RESET_TYPES,
  SECURITY_LEVELS,
  DTC_STATUS_MASK,
  UDS_COMMAND_TEMPLATES,
  connectEcu,
  disconnectEcu,
  sendUdsCommand,
  getConnectionStatus,
  getConnectionConfig,
  pingHost,
  hexToBytes,
  bytesToHex,
  printHex
};