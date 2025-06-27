/**
 * UDS 客户端管理器 - Rust 实现
 * 提供高级的 UDS 诊断服务接口，用于 Tauri 应用
 */
use crate::doip_client::DoipClient;
use crate::types::{ConnectionConfig, DiagnosticResult, DoipClientConfig, UdsConfig, UdsServices};
use crate::uds_service::UdsService;
use crate::utils::{get_timestamp, hex_to_bytes};

pub struct UdsClientManager {
    uds_service: Option<UdsService>,
    is_connected: bool,
    connection_config: Option<ConnectionConfig>,
}

impl UdsClientManager {
    /// 创建新的 UDS 客户端管理器
    pub fn new() -> Self {
        Self {
            uds_service: None,
            is_connected: false,
            connection_config: None,
        }
    }

    /// 连接到 ECU
    pub async fn connect(&mut self, config: ConnectionConfig) -> DiagnosticResult {
        self.connection_config = Some(config.clone());

        let doip_config = DoipClientConfig {
            ip_address: config.ip_address.clone(),
            port: config.port,
            timeout: config.timeout,
        };

        let mut doip_client = DoipClient::new(doip_config);

        match doip_client.connect().await {
            Ok(true) => {
                println!("TCP connection established successfully");

                // 创建 UDS 服务
                let uds_config = UdsConfig {
                    vehicle_info: crate::types::VehicleConfig {
                        server_address: config.server_address.clone(),
                        client_address: config.client_address.clone(),
                    },
                };

                println!(
                    "Creating UDS service with server_address: {}, client_address: {}",
                    config.server_address, config.client_address
                );

                match UdsService::new(doip_client, uds_config) {
                    Ok(mut uds_service) => {
                        // 执行路由激活
                        match uds_service.routine_active().await {
                            Ok(true) => {
                                self.uds_service = Some(uds_service);
                                self.is_connected = true;

                                DiagnosticResult {
                                    success: true,
                                    message: format!(
                                        "成功连接到ECU {}:{} 并完成路由激活",
                                        config.ip_address, config.port
                                    ),
                                    data: None,
                                    timestamp: get_timestamp(),
                                }
                            }
                            Ok(false) => DiagnosticResult {
                                success: false,
                                message: "路由激活被拒绝".to_string(),
                                data: None,
                                timestamp: get_timestamp(),
                            },
                            Err(e) => {
                                // 记录详细的路由激活失败信息
                                eprintln!("Routing activation failed: {:?}", e);
                                DiagnosticResult {
                                    success: false,
                                    message: format!("路由激活失败: {:?}", e),
                                    data: None,
                                    timestamp: get_timestamp(),
                                }
                            }
                        }
                    }
                    Err(e) => DiagnosticResult {
                        success: false,
                        message: format!("创建UDS服务失败: {}", e),
                        data: None,
                        timestamp: get_timestamp(),
                    },
                }
            }
            Ok(false) => DiagnosticResult {
                success: false,
                message: "连接ECU失败".to_string(),
                data: None,
                timestamp: get_timestamp(),
            },
            Err(e) => DiagnosticResult {
                success: false,
                message: format!("连接ECU失败: {:?}", e),
                data: None,
                timestamp: get_timestamp(),
            },
        }
    }

    /// 断开连接
    pub async fn disconnect(&mut self) -> DiagnosticResult {
        self.uds_service = None;
        self.is_connected = false;

        DiagnosticResult {
            success: true,
            message: "已断开ECU连接".to_string(),
            data: None,
            timestamp: get_timestamp(),
        }
    }

    /// 检查连接状态
    pub fn get_connection_status(&self) -> bool {
        self.is_connected && self.uds_service.is_some()
    }

    /// 发送 UDS 命令
    pub async fn send_uds_command(&mut self, service_id: &str, data: &str) -> DiagnosticResult {
        if !self.is_connected || self.uds_service.is_none() {
            return DiagnosticResult {
                success: false,
                message: "未连接到ECU".to_string(),
                data: None,
                timestamp: get_timestamp(),
            };
        }

        let service = match u8::from_str_radix(service_id.trim_start_matches("0x"), 16) {
            Ok(s) => s,
            Err(_) => {
                return DiagnosticResult {
                    success: false,
                    message: format!("无效的服务ID: {}", service_id),
                    data: None,
                    timestamp: get_timestamp(),
                };
            }
        };

        let data_bytes = match self.hex_string_to_bytes(data) {
            Ok(bytes) => bytes,
            Err(e) => {
                return DiagnosticResult {
                    success: false,
                    message: format!("无效的数据格式: {}", e),
                    data: None,
                    timestamp: get_timestamp(),
                };
            }
        };

        let uds_service = self.uds_service.as_mut().unwrap();

        let result = match service {
            UdsServices::DIAGNOSTIC_SESSION_CONTROL => {
                let session = if data_bytes.len() > 1 {
                    data_bytes[1]
                } else {
                    0x01
                };
                match uds_service.start_session(session).await {
                    Ok(success) => (success, "会话控制".to_string(), None),
                    Err(e) => (false, format!("会话控制失败: {}", e), None),
                }
            }

            UdsServices::ECU_RESET => {
                let reset_type = if data_bytes.len() > 1 {
                    data_bytes[1]
                } else {
                    0x01
                };
                match uds_service.ecu_reset(reset_type).await {
                    Ok(success) => (success, "ECU重启".to_string(), None),
                    Err(e) => (false, format!("ECU重启失败: {}", e), None),
                }
            }

            UdsServices::CLEAR_DIAGNOSTIC_INFORMATION => {
                match uds_service.clear_diagnostic_information().await {
                    Ok(success) => (success, "清除DTC".to_string(), None),
                    Err(e) => (false, format!("清除DTC失败: {}", e), None),
                }
            }

            UdsServices::READ_DTC_INFORMATION => {
                let sub_func = if data_bytes.len() > 1 {
                    data_bytes[1]
                } else {
                    0x02
                };
                match uds_service.read_dtc_information(sub_func).await {
                    Ok(response) => (response.success, "读取DTC信息".to_string(), response.data),
                    Err(e) => (false, format!("读取DTC信息失败: {}", e), None),
                }
            }

            UdsServices::READ_DATA_BY_IDENTIFIER => {
                if data_bytes.len() >= 3 {
                    let did = ((data_bytes[1] as u16) << 8) | (data_bytes[2] as u16);
                    match uds_service.read_data_by_identifier(did).await {
                        Ok(response) => (
                            response.success,
                            format!("读取DID 0x{:04x}", did),
                            response.data,
                        ),
                        Err(e) => (false, format!("读取DID失败: {}", e), None),
                    }
                } else {
                    (false, "DID参数不足".to_string(), None)
                }
            }

            UdsServices::SECURITY_ACCESS => {
                if data_bytes.len() >= 2 {
                    let level = data_bytes[1];
                    if level % 2 == 1 {
                        // 奇数级别：获取种子
                        match uds_service.security_access_get_seed(level).await {
                            Ok(success) => (success, "获取安全访问种子".to_string(), None),
                            Err(e) => (false, format!("获取安全访问种子失败: {}", e), None),
                        }
                    } else {
                        // 偶数级别：发送密钥（这里需要实际的密钥计算）
                        let key = 0x1234u32; // 示例密钥，实际应用中需要正确计算
                        match uds_service.security_access_compare_key(level, key).await {
                            Ok(success) => (success, "安全访问验证".to_string(), None),
                            Err(e) => (false, format!("安全访问验证失败: {}", e), None),
                        }
                    }
                } else {
                    (false, "安全访问级别参数不足".to_string(), None)
                }
            }

            UdsServices::COMMUNICATION_CONTROL => {
                let comm_type = if data_bytes.len() > 1 {
                    data_bytes[1]
                } else {
                    0x00
                };
                match uds_service.communication_control(comm_type).await {
                    Ok(success) => (success, "通信控制".to_string(), None),
                    Err(e) => (false, format!("通信控制失败: {}", e), None),
                }
            }

            UdsServices::WRITE_DATA_BY_IDENTIFIER => {
                if data_bytes.len() >= 3 {
                    let did = ((data_bytes[1] as u16) << 8) | (data_bytes[2] as u16);
                    let write_data = String::from_utf8_lossy(&data_bytes[3..]);
                    match uds_service.write_data_by_identifier(did, &write_data).await {
                        Ok(response) => (
                            response.success,
                            format!("写入DID 0x{:04x}", did),
                            response.data,
                        ),
                        Err(e) => (false, format!("写入DID失败: {}", e), None),
                    }
                } else {
                    (false, "写入DID参数不足".to_string(), None)
                }
            }

            UdsServices::TESTER_PRESENT => {
                let suppress_resp = data_bytes.len() > 1 && data_bytes[1] == 0x80;
                match uds_service.tester_present(suppress_resp).await {
                    Ok(success) => (success, "测试器在线".to_string(), None),
                    Err(e) => (false, format!("测试器在线失败: {}", e), None),
                }
            }

            UdsServices::CONTROL_DTC_SETTING => {
                let dtc_type = if data_bytes.len() > 1 {
                    data_bytes[1]
                } else {
                    0x02
                };
                match uds_service.control_dtc_setting(dtc_type).await {
                    Ok(success) => (success, "DTC控制".to_string(), None),
                    Err(e) => (false, format!("DTC控制失败: {}", e), None),
                }
            }

            _ => (false, format!("不支持的UDS服务: 0x{:02x}", service), None),
        };

        let (success, message, response_data) = result;
        let final_message = if success {
            format!("{}成功", message)
        } else {
            message
        };

        DiagnosticResult {
            success,
            message: final_message,
            data: response_data.map(|d| serde_json::Value::String(hex::encode(d))),
            timestamp: get_timestamp(),
        }
    }

    /// 获取连接配置
    pub fn get_connection_config(&self) -> Option<&ConnectionConfig> {
        self.connection_config.as_ref()
    }

    /// 工具函数：十六进制字符串转字节数组
    fn hex_string_to_bytes(&self, hex: &str) -> Result<Vec<u8>, String> {
        hex_to_bytes(hex).map_err(|e| e.to_string())
    }
}

impl Default for UdsClientManager {
    fn default() -> Self {
        Self::new()
    }
}
