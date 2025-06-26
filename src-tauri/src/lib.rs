// 模块声明
mod doip_client;
mod security_algorithm;
mod types;
mod uds_client_manager;
mod uds_service;
mod utils;

use crate::types::{ConnectionConfig, DiagnosticResult};
use crate::uds_client_manager::UdsClientManager;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

// 全局状态管理
type UdsManagerState = Arc<Mutex<UdsClientManager>>;

// Tauri 命令
#[tauri::command]
async fn connect_ecu(
    config: ConnectionConfig,
    state: State<'_, UdsManagerState>,
) -> Result<DiagnosticResult, String> {
    let mut manager = state.lock().await;
    Ok(manager.connect(config).await)
}

#[tauri::command]
async fn disconnect_ecu(state: State<'_, UdsManagerState>) -> Result<DiagnosticResult, String> {
    let mut manager = state.lock().await;
    Ok(manager.disconnect().await)
}

#[tauri::command]
async fn get_connection_status(state: State<'_, UdsManagerState>) -> Result<bool, String> {
    let manager = state.lock().await;
    Ok(manager.get_connection_status())
}

#[tauri::command]
async fn send_uds_command(
    service_id: String,
    data: String,
    state: State<'_, UdsManagerState>,
) -> Result<DiagnosticResult, String> {
    let mut manager = state.lock().await;
    Ok(manager.send_uds_command(&service_id, &data).await)
}

#[tauri::command]
async fn get_connection_config(
    state: State<'_, UdsManagerState>,
) -> Result<Option<ConnectionConfig>, String> {
    let manager = state.lock().await;
    Ok(manager.get_connection_config().cloned())
}

// 测试安全访问算法的命令
#[tauri::command]
fn test_security_access() -> String {
    crate::security_algorithm::test_security_access();
    "Security access test completed. Check console for results.".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志
    env_logger::init();

    // 创建全局状态
    let uds_manager = Arc::new(Mutex::new(UdsClientManager::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(uds_manager)
        .invoke_handler(tauri::generate_handler![
            connect_ecu,
            disconnect_ecu,
            get_connection_status,
            send_uds_command,
            get_connection_config,
            test_security_access
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
