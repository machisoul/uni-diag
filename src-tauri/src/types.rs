/**
 * 共享类型定义
 * 定义 DoIP 和 UDS 相关的数据结构
 */
use serde::{Deserialize, Serialize};

/// DoIP 客户端配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DoipClientConfig {
    pub ip_address: String,
    pub port: u16,
    pub timeout: Option<u64>, // 超时时间（毫秒）
}

/// 车辆配置信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VehicleConfig {
    pub server_address: String,
    pub client_address: String,
}

/// UDS 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UdsConfig {
    pub vehicle_info: VehicleConfig,
}

/// UDS 响应结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UdsResponse {
    pub success: bool,
    pub data: Option<Vec<u8>>,
    pub error: Option<String>,
}

/// 诊断结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticResult {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
    pub timestamp: String,
}

/// 连接配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub ip_address: String,
    pub port: u16,
    pub server_address: String,
    pub client_address: String,
    pub timeout: Option<u64>,
}

/// UDS 服务 ID 常量
pub struct UdsServices;

impl UdsServices {
    pub const DIAGNOSTIC_SESSION_CONTROL: u8 = 0x10;
    pub const ECU_RESET: u8 = 0x11;
    pub const CLEAR_DIAGNOSTIC_INFORMATION: u8 = 0x14;
    pub const READ_DTC_INFORMATION: u8 = 0x19;
    pub const READ_DATA_BY_IDENTIFIER: u8 = 0x22;
    pub const SECURITY_ACCESS: u8 = 0x27;
    pub const COMMUNICATION_CONTROL: u8 = 0x28;
    pub const WRITE_DATA_BY_IDENTIFIER: u8 = 0x2E;
    pub const ROUTINE_CONTROL: u8 = 0x31;
    pub const TESTER_PRESENT: u8 = 0x3E;
    pub const CONTROL_DTC_SETTING: u8 = 0x85;
}

/// 常用 DID（数据标识符）常量
pub struct CommonDids;

impl CommonDids {
    pub const VIN: u16 = 0xF190;
    pub const HARDWARE_VERSION: u16 = 0xF191;
    pub const SOFTWARE_VERSION: u16 = 0xF194;
    pub const CALIBRATION_VERSION: u16 = 0xF195;
    pub const ECU_SERIAL_NUMBER: u16 = 0xF18C;
    pub const ECU_MANUFACTURING_DATE: u16 = 0xF18A;
    pub const ECU_INSTALLATION_DATE: u16 = 0xF18B;
}

/// 会话类型常量
pub struct SessionTypes;

impl SessionTypes {
    pub const DEFAULT: u8 = 0x01;
    pub const PROGRAMMING: u8 = 0x02;
    pub const EXTENDED: u8 = 0x03;
}

/// 重启类型常量
pub struct ResetTypes;

impl ResetTypes {
    pub const HARD_RESET: u8 = 0x01;
    pub const KEY_OFF_ON_RESET: u8 = 0x02;
    pub const SOFT_RESET: u8 = 0x03;
}

/// 安全访问级别常量
pub struct SecurityLevels;

impl SecurityLevels {
    pub const LEVEL1_SEED: u8 = 0x01;
    pub const LEVEL1_KEY: u8 = 0x02;
    pub const LEVEL2_SEED: u8 = 0x03;
    pub const LEVEL2_KEY: u8 = 0x04;
    pub const LEVEL3_SEED: u8 = 0x05;
    pub const LEVEL3_KEY: u8 = 0x06;
    pub const LEVEL4_SEED: u8 = 0x07;
    pub const LEVEL4_KEY: u8 = 0x08;
}

/// DTC 状态掩码常量
pub struct DtcStatusMask;

impl DtcStatusMask {
    pub const TEST_FAILED: u8 = 0x01;
    pub const TEST_FAILED_THIS_OPERATION_CYCLE: u8 = 0x02;
    pub const PENDING_DTC: u8 = 0x04;
    pub const CONFIRMED_DTC: u8 = 0x08;
    pub const TEST_NOT_COMPLETED_SINCE_LAST_CLEAR: u8 = 0x10;
    pub const TEST_FAILED_SINCE_LAST_CLEAR: u8 = 0x20;
    pub const TEST_NOT_COMPLETED_THIS_OPERATION_CYCLE: u8 = 0x40;
    pub const WARNING_INDICATOR_REQUESTED: u8 = 0x80;
}

/// 错误类型定义
#[derive(Debug, thiserror::Error)]
pub enum DoipError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),

    #[error("Send failed: {0}")]
    SendFailed(String),

    #[error("Receive failed: {0}")]
    ReceiveFailed(String),

    #[error("Timeout occurred")]
    Timeout,

    #[error("Invalid data format: {0}")]
    InvalidData(String),

    #[error("Protocol error: {0}")]
    ProtocolError(String),

    #[error("Not connected")]
    NotConnected,

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

/// UDS 错误类型
#[derive(Debug, thiserror::Error)]
pub enum UdsError {
    #[error("DoIP error: {0}")]
    DoipError(#[from] DoipError),

    #[error("Service not supported: {0:02X}")]
    ServiceNotSupported(u8),

    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),

    #[error("Security access denied")]
    SecurityAccessDenied,

    #[error("Request denied: {0}")]
    RequestDenied(String),

    #[error("Response timeout")]
    ResponseTimeout,

    #[error("Invalid response: {0}")]
    InvalidResponse(String),
}

pub type Result<T> = std::result::Result<T, DoipError>;
pub type UdsResult<T> = std::result::Result<T, UdsError>;
