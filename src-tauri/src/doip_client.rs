/**
 * DoIP 客户端 - Rust 实现
 * 用于与 ECU 进行 DoIP 通信，使用 TCP 连接替代 WebSocket
 */
use crate::types::{DoipClientConfig, DoipError, Result};
use crate::utils::{get_timestamp, print_hex};
use std::net::SocketAddr;
use std::time::Duration;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::time::timeout;

pub struct DoipClient {
    config: DoipClientConfig,
    stream: Option<TcpStream>,
    is_connected: bool,
}

impl DoipClient {
    /// 创建新的 DoIP 客户端
    pub fn new(config: DoipClientConfig) -> Self {
        Self {
            config,
            stream: None,
            is_connected: false,
        }
    }

    /// 连接到 DoIP 服务
    pub async fn connect(&mut self) -> Result<bool> {
        let addr = format!("{}:{}", self.config.ip_address, self.config.port);
        let socket_addr: SocketAddr = addr
            .parse()
            .map_err(|e| DoipError::ConnectionFailed(format!("Invalid address: {}", e)))?;

        let timeout_duration = Duration::from_millis(self.config.timeout.unwrap_or(30000));

        match timeout(timeout_duration, TcpStream::connect(socket_addr)).await {
            Ok(Ok(stream)) => {
                self.stream = Some(stream);
                self.is_connected = true;
                self.log(
                    "info",
                    &format!(
                        "Connected to {}:{}",
                        self.config.ip_address, self.config.port
                    ),
                );
                Ok(true)
            }
            Ok(Err(e)) => {
                self.log("error", &format!("Connection failed: {}", e));
                Err(DoipError::ConnectionFailed(e.to_string()))
            }
            Err(_) => {
                self.log("error", "Connection timeout");
                Err(DoipError::Timeout)
            }
        }
    }

    /// 发送数据
    pub async fn send(&mut self, data: &[u8]) -> Result<bool> {
        if !self.is_connected || self.stream.is_none() {
            return Err(DoipError::NotConnected);
        }

        let stream = self.stream.as_mut().unwrap();

        match stream.write_all(data).await {
            Ok(_) => {
                self.log("debug", &format!("Sent {} bytes", data.len()));

                if data.len() < 256 {
                    print_hex(data, 32);
                }

                Ok(true)
            }
            Err(e) => {
                self.log("error", &format!("Send failed: {}", e));
                Err(DoipError::SendFailed(e.to_string()))
            }
        }
    }

    /// 接收数据
    pub async fn receive(&mut self) -> Result<Vec<u8>> {
        if !self.is_connected || self.stream.is_none() {
            return Err(DoipError::NotConnected);
        }

        let stream = self.stream.as_mut().unwrap();
        let timeout_duration = Duration::from_millis(self.config.timeout.unwrap_or(30000));

        let mut buffer = vec![0u8; 4096]; // 4KB 缓冲区

        match timeout(timeout_duration, stream.read(&mut buffer)).await {
            Ok(Ok(n)) if n > 0 => {
                buffer.truncate(n);
                self.log("debug", &format!("Received {} bytes", n));

                if n < 256 {
                    print_hex(&buffer, 32);
                }

                Ok(buffer)
            }
            Ok(Ok(0)) => {
                self.log("info", "Connection closed by peer");
                self.is_connected = false;
                Err(DoipError::ConnectionFailed(
                    "Connection closed by peer".to_string(),
                ))
            }
            Ok(Ok(_)) => {
                // 处理其他大小的读取
                self.log("debug", &format!("Received {} bytes", buffer.len()));
                Ok(buffer)
            }
            Ok(Err(e)) => {
                self.log("error", &format!("Receive failed: {}", e));
                Err(DoipError::ReceiveFailed(e.to_string()))
            }
            Err(_) => {
                self.log("error", "Receive timeout");
                Err(DoipError::Timeout)
            }
        }
    }

    /// 接收指定长度的数据
    pub async fn receive_exact(&mut self, len: usize) -> Result<Vec<u8>> {
        if !self.is_connected || self.stream.is_none() {
            return Err(DoipError::NotConnected);
        }

        let stream = self.stream.as_mut().unwrap();
        let timeout_duration = Duration::from_millis(self.config.timeout.unwrap_or(30000));

        let mut buffer = vec![0u8; len];

        match timeout(timeout_duration, stream.read_exact(&mut buffer)).await {
            Ok(Ok(_)) => {
                self.log("debug", &format!("Received exactly {} bytes", len));

                if len < 256 {
                    print_hex(&buffer, 32);
                }

                Ok(buffer)
            }
            Ok(Err(e)) => {
                self.log("error", &format!("Receive exact failed: {}", e));
                Err(DoipError::ReceiveFailed(e.to_string()))
            }
            Err(_) => {
                self.log("error", "Receive exact timeout");
                Err(DoipError::Timeout)
            }
        }
    }

    /// 断开连接
    pub async fn disconnect(&mut self) -> Result<bool> {
        if let Some(mut stream) = self.stream.take() {
            if let Err(e) = stream.shutdown().await {
                self.log("error", &format!("Shutdown failed: {}", e));
            }
        }

        self.is_connected = false;
        self.log("info", "Connection closed");
        Ok(true)
    }

    /// 检查连接状态
    pub fn is_socket_connected(&self) -> bool {
        self.is_connected && self.stream.is_some()
    }

    /// 获取配置
    pub fn get_config(&self) -> &DoipClientConfig {
        &self.config
    }

    /// 设置超时时间
    pub fn set_timeout(&mut self, timeout_ms: u64) {
        self.config.timeout = Some(timeout_ms);
    }

    /// 日志记录
    fn log(&self, level: &str, message: &str) {
        let timestamp = get_timestamp();
        match level {
            "info" => log::info!("[{}] [DOIP] {}", timestamp, message),
            "debug" => log::debug!("[{}] [DOIP] {}", timestamp, message),
            "error" => log::error!("[{}] [DOIP] {}", timestamp, message),
            _ => log::info!("[{}] [DOIP] {}", timestamp, message),
        }
    }
}

impl Drop for DoipClient {
    fn drop(&mut self) {
        if self.is_connected {
            self.log("info", "DoipClient dropped, cleaning up connection");
            // 注意：在 Drop 中不能使用 async，所以这里只是标记状态
            self.is_connected = false;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_doip_client_creation() {
        let config = DoipClientConfig {
            ip_address: "127.0.0.1".to_string(),
            port: 13400,
            timeout: Some(5000),
        };

        let client = DoipClient::new(config);
        assert!(!client.is_socket_connected());
        assert_eq!(client.get_config().ip_address, "127.0.0.1");
        assert_eq!(client.get_config().port, 13400);
    }

    #[tokio::test]
    async fn test_invalid_address() {
        let config = DoipClientConfig {
            ip_address: "invalid_address".to_string(),
            port: 13400,
            timeout: Some(1000),
        };

        let mut client = DoipClient::new(config);
        let result = client.connect().await;
        assert!(result.is_err());
    }
}
