/**
 * 服务模块导出
 * 统一导出所有诊断服务
 */

// 导出DoIP客户端
export { DoipClient, hexToBytes, bytesToHex, printHex } from './DoipClient';
export type { DoipClientConfig } from './DoipClient';

// 导出UDS服务
export { UdsService } from './UdsService';
export type { VehicleConfig, UdsConfig, UdsResponse } from './UdsService';

// 导出安全访问算法
export { SecurityAccessAlgorithm, testSecurityAccess } from './SecurityAccessAlgorithm';

// 导出UDS客户端管理器
export { UdsClientManager, udsClientManager } from './UdsClientManager';
export type { DiagnosticResult, ConnectionConfig } from './UdsClientManager';

// 常用的UDS服务ID常量
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

// 常用的DID（数据标识符）常量
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

// DTC状态掩码常量
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
