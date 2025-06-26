/**
 * UDS 服务 - Rust 实现
 * 提供完整的 UDS 诊断服务功能
 */
use crate::doip_client::DoipClient;
use crate::security_algorithm::SecurityAccessAlgorithm;
use crate::types::{UdsConfig, UdsError, UdsResponse, UdsResult};
use crate::utils::{
    bytes_to_ascii_with_escape, bytes_to_int, ends_with, extract_last_frame, find_bytes,
    get_timestamp, hex_to_address_bytes, hex_to_bytes, int_to_bytes, is_continuous_frames,
    starts_with,
};

pub struct UdsService {
    client: DoipClient,
    security_algorithm: SecurityAccessAlgorithm,
    security_access_seed: Vec<u8>,
    server_address: Vec<u8>,
    client_address: Vec<u8>,
    doip_head_bytes: Vec<u8>,
    doip_address_bytes: Vec<u8>,
    reverse_doip_address_bytes: Vec<u8>,
}

impl UdsService {
    /// 创建新的 UDS 服务实例
    pub fn new(client: DoipClient, config: UdsConfig) -> UdsResult<Self> {
        let security_algorithm = SecurityAccessAlgorithm::new();

        // 解析地址配置
        let server_address = hex_to_address_bytes(&config.vehicle_info.server_address)
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid server address: {}", e)))?;
        let client_address = hex_to_address_bytes(&config.vehicle_info.client_address)
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid client address: {}", e)))?;

        // DoIP 协议头
        let doip_head_bytes = hex_to_bytes("02 fd 80 01")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid DoIP header: {}", e)))?;

        // 组合地址字节
        let mut doip_address_bytes = Vec::new();
        doip_address_bytes.extend_from_slice(&client_address);
        doip_address_bytes.extend_from_slice(&server_address);

        let mut reverse_doip_address_bytes = Vec::new();
        reverse_doip_address_bytes.extend_from_slice(&server_address);
        reverse_doip_address_bytes.extend_from_slice(&client_address);

        Ok(Self {
            client,
            security_algorithm,
            security_access_seed: Vec::new(),
            server_address,
            client_address,
            doip_head_bytes,
            doip_address_bytes,
            reverse_doip_address_bytes,
        })
    }

    /// 处理 DoIP 接收数据
    async fn doip_receive_handle(&mut self, service: &[u8]) -> UdsResult<Vec<u8>> {
        loop {
            let data = self.client.receive().await.map_err(UdsError::DoipError)?;

            // 检查连续帧
            if is_continuous_frames(&data, &self.doip_head_bytes) {
                if let Some(last_frame) = extract_last_frame(&data, &self.doip_head_bytes) {
                    return Ok(last_frame);
                }
            }

            // 检查 7F 78 响应（请求正确接收-响应挂起）
            let mut target78 = vec![0x7f];
            target78.extend_from_slice(service);
            target78.push(0x78);
            if find_bytes(&data, &target78).is_some() {
                continue;
            }

            // 检查 7F 21 响应（忙-请求序列错误）
            let mut target21 = vec![0x7f];
            target21.extend_from_slice(service);
            target21.push(0x21);
            if find_bytes(&data, &target21).is_some() {
                continue;
            }

            // 检查地址响应
            let mut address_target = self.reverse_doip_address_bytes.clone();
            address_target.push(0x00);
            if ends_with(&data, &address_target) {
                continue;
            }

            if !data.is_empty() {
                return Ok(data);
            }
        }
    }

    /// 路由激活
    pub async fn routine_active(&mut self) -> UdsResult<bool> {
        let request = hex_to_bytes("02 fd 00 05 00 00 00 0b 0e 80 00 00 00 00 00 ff ff ff ff")
            .map_err(|e| {
                UdsError::InvalidParameter(format!("Invalid routine active request: {}", e))
            })?;

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        let response = self.doip_receive_handle(&[0x00]).await?;

        // 检查响应
        let mut expected_start = hex_to_bytes("02 fd 00 06 00 00 00 09")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid expected response: {}", e)))?;
        expected_start.extend_from_slice(&self.doip_address_bytes);
        expected_start.extend_from_slice(&hex_to_bytes("10 00 00 00 00").map_err(|e| {
            UdsError::InvalidParameter(format!("Invalid expected response suffix: {}", e))
        })?);

        if starts_with(&response, &expected_start) {
            self.log("info", "Routine active granted");
            Ok(true)
        } else {
            self.log("error", "Routine active denied or error occurred");
            Err(UdsError::RequestDenied("Routine active denied".to_string()))
        }
    }

    /// 启动诊断会话
    pub async fn start_session(&mut self, session: u8) -> UdsResult<bool> {
        let request_length_bytes = hex_to_bytes("00 00 00 06")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid request length: {}", e)))?;

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let mut request = doip_request_bytes;
        request.push(0x10);
        request.push(session);

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        if session > 0x03 {
            return Ok(true);
        }

        let response = self.doip_receive_handle(&[0x10]).await?;

        // 检查正响应
        if find_bytes(&response, &[0x50]).is_some() {
            self.log("info", "Start session granted");
            Ok(true)
        } else {
            self.log("error", "Start session denied or error occurred");
            Err(UdsError::RequestDenied("Start session denied".to_string()))
        }
    }

    /// 控制 DTC 设置
    pub async fn control_dtc_setting(&mut self, dtc_type: u8) -> UdsResult<bool> {
        let request_length_bytes = hex_to_bytes("00 00 00 06")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid request length: {}", e)))?;

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let mut request = doip_request_bytes;
        request.push(0x85);
        request.push(dtc_type);

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        let response = self.doip_receive_handle(&[0x85]).await?;

        // 检查正响应
        if find_bytes(&response, &[0xc5]).is_some() {
            self.log("info", "Control DTC setting granted");
            Ok(true)
        } else {
            self.log("error", "Control DTC setting denied or error occurred");
            Err(UdsError::RequestDenied(
                "Control DTC setting denied".to_string(),
            ))
        }
    }

    /// 通信控制
    pub async fn communication_control(&mut self, comm_type: u8) -> UdsResult<bool> {
        let request_length_bytes = hex_to_bytes("00 00 00 07")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid request length: {}", e)))?;

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let mut request = doip_request_bytes;
        request.push(0x28);
        request.push(comm_type);
        request.push(0x03);

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        if comm_type > 0x80 {
            return Ok(true);
        }

        let response = self.doip_receive_handle(&[0x28]).await?;

        // 检查正响应
        if find_bytes(&response, &[0x68]).is_some() {
            self.log("info", "Communication control granted");
            Ok(true)
        } else {
            self.log("error", "Communication control denied or error occurred");
            Err(UdsError::RequestDenied(
                "Communication control denied".to_string(),
            ))
        }
    }

    /// 读取数据标识符
    pub async fn read_data_by_identifier(&mut self, did: u16) -> UdsResult<UdsResponse> {
        let request_length_bytes = hex_to_bytes("00 00 00 07")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid request length: {}", e)))?;

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let did_bytes = vec![(did >> 8) as u8, did as u8];

        let mut request = doip_request_bytes;
        request.push(0x22);
        request.extend_from_slice(&did_bytes);

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        let response = self.doip_receive_handle(&[0x22]).await?;

        // 检查正响应
        if find_bytes(&response, &[0x62]).is_some() {
            self.log(
                "info",
                &format!("Read data identifier 0x{:04x} granted", did),
            );
            self.bytes_to_ascii(&response, &[vec![0x62], did_bytes].concat());
            Ok(UdsResponse {
                success: true,
                data: Some(response),
                error: None,
            })
        } else {
            self.log(
                "error",
                &format!(
                    "Read data identifier 0x{:04x} denied or error occurred",
                    did
                ),
            );
            Err(UdsError::RequestDenied(
                "Read data identifier denied".to_string(),
            ))
        }
    }

    /// 写入数据标识符
    pub async fn write_data_by_identifier(
        &mut self,
        did: u16,
        data: &str,
    ) -> UdsResult<UdsResponse> {
        let data_bytes = data.as_bytes();
        let data_len = data_bytes.len() + 7;
        let request_length_bytes = int_to_bytes(data_len as u32);

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let did_bytes = vec![(did >> 8) as u8, did as u8];

        let mut request = doip_request_bytes;
        request.push(0x2E);
        request.extend_from_slice(&did_bytes);
        request.extend_from_slice(data_bytes);

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        let response = self.doip_receive_handle(&[0x2E]).await?;

        // 检查正响应
        if find_bytes(&response, &[0x6E]).is_some() {
            self.log(
                "info",
                &format!("Write data identifier 0x{:04x} granted", did),
            );
            Ok(UdsResponse {
                success: true,
                data: Some(response),
                error: None,
            })
        } else {
            self.log(
                "error",
                &format!(
                    "Write data identifier 0x{:04x} denied or error occurred",
                    did
                ),
            );
            Err(UdsError::RequestDenied(
                "Write data identifier denied".to_string(),
            ))
        }
    }

    /// 安全访问 - 获取种子
    pub async fn security_access_get_seed(&mut self, level: u8) -> UdsResult<bool> {
        let request_length_bytes = hex_to_bytes("00 00 00 06")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid request length: {}", e)))?;

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let mut request = doip_request_bytes;
        request.push(0x27);
        request.push(level);

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        let response = self.doip_receive_handle(&[0x27]).await?;

        if find_bytes(&response, &[0x67]).is_some() {
            self.log("info", "Security access get seed granted");
            // 提取最后4个字节作为种子
            if response.len() >= 4 {
                self.security_access_seed = response[response.len() - 4..].to_vec();
                self.print_hex(&self.security_access_seed);
            }
            Ok(true)
        } else {
            self.log("error", "Security access get seed denied or error occurred");
            Err(UdsError::SecurityAccessDenied)
        }
    }

    /// 安全访问 - 比较密钥
    pub async fn security_access_compare_key(&mut self, level: u8, key: u32) -> UdsResult<bool> {
        if self.security_access_seed.is_empty() {
            self.log("error", "No seed available, call getSeed first");
            return Err(UdsError::InvalidParameter("No seed available".to_string()));
        }

        // 将种子转换为数字
        let seed_value = bytes_to_int(&self.security_access_seed)
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid seed: {}", e)))?;

        // 根据级别计算token
        let token = match level {
            2 => {
                self.log("info", "Security access compute level1 compare key");
                self.security_algorithm.compute_key_level1(seed_value, key)
            }
            4 => {
                self.log("info", "Security access compute level2 compare key");
                self.security_algorithm.compute_key_level2(seed_value, key)
            }
            6 => {
                self.log("info", "Security access compute level3 compare key");
                self.security_algorithm.compute_key_level3(seed_value, key)
            }
            8 => {
                self.log("info", "Security access compute level4 compare key");
                self.security_algorithm.compute_key_level4(seed_value, key)
            }
            _ => {
                self.log("error", &format!("Unsupported security level: {}", level));
                return Err(UdsError::InvalidParameter(format!(
                    "Unsupported security level: {}",
                    level
                )));
            }
        };

        let request_length_bytes = hex_to_bytes("00 00 00 0a")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid request length: {}", e)))?;

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let token_bytes = int_to_bytes(token);
        let mut request = doip_request_bytes;
        request.push(0x27);
        request.push(level);
        request.extend_from_slice(&token_bytes);

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        let response = self.doip_receive_handle(&[0x27]).await?;

        if find_bytes(&response, &[0x67]).is_some() {
            self.log("info", "Security access compare key granted");
            Ok(true)
        } else {
            self.log(
                "error",
                "Security access compare key denied or error occurred",
            );
            Err(UdsError::SecurityAccessDenied)
        }
    }

    /// ECU 复位
    pub async fn ecu_reset(&mut self, reset_type: u8) -> UdsResult<bool> {
        let request_length_bytes = hex_to_bytes("00 00 00 06")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid request length: {}", e)))?;

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let mut request = doip_request_bytes;
        request.push(0x11);
        request.push(reset_type);

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        let response = self.doip_receive_handle(&[0x11]).await?;

        if find_bytes(&response, &[0x51]).is_some() {
            self.log("info", "ECU Reset granted");
            Ok(true)
        } else {
            self.log("error", "ECU Reset denied or error occurred");
            Err(UdsError::RequestDenied("ECU Reset denied".to_string()))
        }
    }

    /// 读取 DTC 信息
    pub async fn read_dtc_information(&mut self, sub_function: u8) -> UdsResult<UdsResponse> {
        let request_length_bytes = hex_to_bytes("00 00 00 07")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid request length: {}", e)))?;

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let mut request = doip_request_bytes;
        request.push(0x19);
        request.push(sub_function);
        request.push(0xAF);

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        let response = self.doip_receive_handle(&[0x19]).await?;

        if find_bytes(&response, &[0x59]).is_some() {
            self.log("info", "Read DTC information granted");
            Ok(UdsResponse {
                success: true,
                data: Some(response),
                error: None,
            })
        } else {
            self.log("error", "Read DTC information denied or error occurred");
            Err(UdsError::RequestDenied(
                "Read DTC information denied".to_string(),
            ))
        }
    }

    /// 清除诊断信息
    pub async fn clear_diagnostic_information(&mut self) -> UdsResult<bool> {
        let request_length_bytes = hex_to_bytes("00 00 00 08")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid request length: {}", e)))?;

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let mut request = doip_request_bytes;
        request.push(0x14);
        request.extend_from_slice(&[0xFF, 0xFF, 0xFF]); // 清除所有DTC

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        let response = self.doip_receive_handle(&[0x14]).await?;

        if find_bytes(&response, &[0x54]).is_some() {
            self.log("info", "Clear diagnostic information granted");
            Ok(true)
        } else {
            self.log(
                "error",
                "Clear diagnostic information denied or error occurred",
            );
            Err(UdsError::RequestDenied(
                "Clear diagnostic information denied".to_string(),
            ))
        }
    }

    /// 测试器在线
    pub async fn tester_present(&mut self, suppress_response: bool) -> UdsResult<bool> {
        let request_length_bytes = hex_to_bytes("00 00 00 06")
            .map_err(|e| UdsError::InvalidParameter(format!("Invalid request length: {}", e)))?;

        let mut doip_request_bytes = self.doip_head_bytes.clone();
        doip_request_bytes.extend_from_slice(&request_length_bytes);
        doip_request_bytes.extend_from_slice(&self.doip_address_bytes);

        let sub_function = if suppress_response { 0x80 } else { 0x00 };
        let mut request = doip_request_bytes;
        request.push(0x3E);
        request.push(sub_function);

        self.client
            .send(&request)
            .await
            .map_err(UdsError::DoipError)?;

        if suppress_response {
            return Ok(true); // 抑制响应模式，不等待响应
        }

        let response = self.doip_receive_handle(&[0x3E]).await?;

        if find_bytes(&response, &[0x7E]).is_some() {
            self.log("info", "Tester present granted");
            Ok(true)
        } else {
            self.log("error", "Tester present denied or error occurred");
            Err(UdsError::RequestDenied("Tester present denied".to_string()))
        }
    }

    /// 工具函数：将字节转换为ASCII
    fn bytes_to_ascii(&self, data: &[u8], target_sequence: &[u8]) {
        if let Some(start_index) = find_bytes(data, target_sequence) {
            let ascii_bytes = &data[start_index + target_sequence.len()..];
            let ascii_str = bytes_to_ascii_with_escape(ascii_bytes);
            self.log(
                "info",
                &format!("Read data identifier transform ascii: {}", ascii_str),
            );
        } else {
            self.log("error", "Target sequence not found!");
        }
    }

    /// 工具函数：打印十六进制数据
    fn print_hex(&self, data: &[u8]) {
        crate::utils::print_hex(data, 32);
    }

    /// 日志记录
    fn log(&self, level: &str, message: &str) {
        let timestamp = get_timestamp();
        match level {
            "info" => log::info!("[{}] [UDS] {}", timestamp, message),
            "debug" => log::debug!("[{}] [UDS] {}", timestamp, message),
            "error" => log::error!("[{}] [UDS] {}", timestamp, message),
            _ => log::info!("[{}] [UDS] {}", timestamp, message),
        }
    }
}
