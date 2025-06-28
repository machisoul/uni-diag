use serde::{Deserialize, Serialize};
use std::net::{IpAddr, ToSocketAddrs};
use std::time::Instant;

#[derive(Serialize, Deserialize)]
pub struct PingResult {
    pub success: bool,
    pub host: String,
    pub ip: Option<String>,
    pub time_ms: Option<f64>,
    pub error: Option<String>,
    pub method: String, // 标识使用的方法：icmp_ping, system_ping 或 http_ping
}

// 跨平台的 ping 实现
pub async fn ping_host(host: String) -> Result<PingResult, String> {
    // 优先使用 ICMP ping（跨平台兼容）
    match icmp_ping(&host).await {
        Ok(result) => Ok(result),
        Err(_) => {
            // ICMP ping 失败时，尝试系统 ping（仅桌面端）
            if !cfg!(target_os = "ios") && !cfg!(target_os = "android") {
                system_ping(&host).await
            } else {
                // 移动端如果 ICMP ping 失败，直接返回错误
                Err(
                    "ICMP ping failed and system ping not available on mobile platforms"
                        .to_string(),
                )
            }
        }
    }
}

// 使用 ICMP ping（跨平台兼容，包括 iOS）
async fn icmp_ping(host: &str) -> Result<PingResult, String> {
    // 解析主机名到 IP 地址
    let ip = resolve_host(host).await?;

    // 使用 surge-ping 进行 ICMP ping
    let payload = &[0u8; 56]; // 标准 ping 包大小

    match surge_ping::ping(ip, payload).await {
        Ok((_packet, duration)) => Ok(PingResult {
            success: true,
            host: host.to_string(),
            ip: Some(ip.to_string()),
            time_ms: Some(duration.as_secs_f64() * 1000.0),
            error: None,
            method: "icmp_ping".to_string(),
        }),
        Err(e) => Err(format!("ICMP ping failed: {}", e)),
    }
}

// 解析主机名到 IP 地址
async fn resolve_host(host: &str) -> Result<IpAddr, String> {
    // 如果已经是 IP 地址，直接解析
    if let Ok(ip) = host.parse::<IpAddr>() {
        return Ok(ip);
    }

    // 否则进行 DNS 解析
    let socket_addrs = format!("{}:80", host)
        .to_socket_addrs()
        .map_err(|e| format!("DNS resolution failed: {}", e))?;

    socket_addrs
        .into_iter()
        .next()
        .map(|addr| addr.ip())
        .ok_or_else(|| "No IP address found".to_string())
}

// 使用系统 ping 命令（仅适用于桌面端）
async fn system_ping(host: &str) -> Result<PingResult, String> {
    use std::process::Command;

    let start_time = Instant::now();

    let output = if cfg!(target_os = "windows") {
        Command::new("ping").args(["-n", "1", host]).output()
    } else {
        Command::new("ping").args(["-c", "1", host]).output()
    };

    let elapsed = start_time.elapsed();

    match output {
        Ok(output) => {
            if output.status.success() {
                Ok(PingResult {
                    success: true,
                    host: host.to_string(),
                    ip: None, // 系统 ping 不返回解析的 IP
                    time_ms: Some(elapsed.as_secs_f64() * 1000.0),
                    error: None,
                    method: "system_ping".to_string(),
                })
            } else {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                Err(format!("System ping failed: {}", error_msg))
            }
        }
        Err(e) => Err(format!("Failed to execute ping command: {}", e)),
    }
}
