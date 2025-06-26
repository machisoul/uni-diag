/**
 * 接口模块导出
 * 统一导出所有诊断服务接口
 */

// 导出新的 Rust 实现的接口
export {
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
  hexToBytes,
  bytesToHex,
  printHex
} from './uds_doip';

// 导出类型
export type {
  ConnectionConfig,
  DiagnosticResult
} from './uds_doip';

// 默认导出
export { default } from './uds_doip';
