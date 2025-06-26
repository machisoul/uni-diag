/**
 * 工具函数模块
 * 提供数据转换、十六进制处理等通用功能
 */

use crate::types::DoipError;

/// 十六进制字符串转字节数组
pub fn hex_to_bytes(hex: &str) -> Result<Vec<u8>, DoipError> {
    let clean_hex = hex.replace(' ', "").replace('\t', "").replace('\n', "");
    
    if clean_hex.len() % 2 != 0 {
        return Err(DoipError::InvalidData("Hex string length must be even".to_string()));
    }
    
    let mut bytes = Vec::with_capacity(clean_hex.len() / 2);
    
    for i in (0..clean_hex.len()).step_by(2) {
        let byte_str = &clean_hex[i..i + 2];
        match u8::from_str_radix(byte_str, 16) {
            Ok(byte) => bytes.push(byte),
            Err(_) => return Err(DoipError::InvalidData(format!("Invalid hex byte: {}", byte_str))),
        }
    }
    
    Ok(bytes)
}

/// 字节数组转十六进制字符串
pub fn bytes_to_hex(bytes: &[u8]) -> String {
    bytes.iter()
        .map(|byte| format!("{:02x}", byte))
        .collect::<Vec<String>>()
        .join(" ")
}

/// 打印十六进制数据
pub fn print_hex(data: &[u8], bytes_per_line: usize) {
    for (i, chunk) in data.chunks(bytes_per_line).enumerate() {
        let offset = i * bytes_per_line;
        let hex_str = chunk.iter()
            .map(|byte| format!("{:02x}", byte))
            .collect::<Vec<String>>()
            .join(" ");
        log::info!("0x{:04x}: {}", offset, hex_str);
    }
}

/// 将十六进制地址字符串转换为字节数组
pub fn hex_to_address_bytes(hex_str: &str) -> Result<Vec<u8>, DoipError> {
    let value = u16::from_str_radix(hex_str, 16)
        .map_err(|_| DoipError::InvalidData(format!("Invalid hex address: {}", hex_str)))?;
    
    Ok(vec![(value >> 8) as u8, value as u8])
}

/// 32位整数转字节数组（大端序）
pub fn int_to_bytes(value: u32) -> Vec<u8> {
    value.to_be_bytes().to_vec()
}

/// 字节数组转32位整数（大端序）
pub fn bytes_to_int(bytes: &[u8]) -> Result<u32, DoipError> {
    if bytes.len() != 4 {
        return Err(DoipError::InvalidData("Bytes array must be 4 bytes long".to_string()));
    }
    
    let mut array = [0u8; 4];
    array.copy_from_slice(bytes);
    Ok(u32::from_be_bytes(array))
}

/// 在字节数组中查找子序列
pub fn find_bytes(data: &[u8], target: &[u8]) -> Option<usize> {
    if target.is_empty() || data.len() < target.len() {
        return None;
    }
    
    for i in 0..=data.len() - target.len() {
        if data[i..i + target.len()] == *target {
            return Some(i);
        }
    }
    
    None
}

/// 检查字节数组是否以指定序列开始
pub fn starts_with(data: &[u8], prefix: &[u8]) -> bool {
    if data.len() < prefix.len() {
        return false;
    }
    
    data[..prefix.len()] == *prefix
}

/// 检查字节数组是否以指定序列结束
pub fn ends_with(data: &[u8], suffix: &[u8]) -> bool {
    if data.len() < suffix.len() {
        return false;
    }
    
    let start = data.len() - suffix.len();
    data[start..] == *suffix
}

/// 检查是否为连续帧
pub fn is_continuous_frames(data: &[u8], start_marker: &[u8]) -> bool {
    let mut count = 0;
    let mut pos = 0;
    
    while pos < data.len() {
        if let Some(found) = find_bytes(&data[pos..], start_marker) {
            count += 1;
            pos = pos + found + 1;
        } else {
            break;
        }
    }
    
    count > 1
}

/// 提取最后一帧
pub fn extract_last_frame(data: &[u8], start_marker: &[u8]) -> Option<Vec<u8>> {
    let mut last_index = None;
    let mut pos = 0;
    
    while pos < data.len() {
        if let Some(found) = find_bytes(&data[pos..], start_marker) {
            last_index = Some(pos + found);
            pos = pos + found + 1;
        } else {
            break;
        }
    }
    
    last_index.map(|index| data[index..].to_vec())
}

/// 字节转ASCII字符串（处理不可打印字符）
pub fn bytes_to_ascii(data: &[u8]) -> String {
    data.iter()
        .map(|&byte| {
            if byte >= 0x20 && byte <= 0x7E {
                char::from(byte)
            } else {
                '.'
            }
        })
        .collect()
}

/// 字节转ASCII字符串（带十六进制转义）
pub fn bytes_to_ascii_with_escape(data: &[u8]) -> String {
    data.iter()
        .map(|&byte| {
            if byte >= 0x20 && byte <= 0x7E {
                char::from(byte).to_string()
            } else {
                format!("\\x{:02x}", byte)
            }
        })
        .collect()
}

/// 获取当前时间戳（ISO 8601格式）
pub fn get_timestamp() -> String {
    chrono::Utc::now().to_rfc3339()
}

/// 日志记录宏
#[macro_export]
macro_rules! log_with_timestamp {
    ($level:ident, $($arg:tt)*) => {
        log::$level!("[{}] {}", $crate::utils::get_timestamp(), format!($($arg)*));
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hex_to_bytes() {
        let result = hex_to_bytes("02 fd 80 01").unwrap();
        assert_eq!(result, vec![0x02, 0xfd, 0x80, 0x01]);
        
        let result = hex_to_bytes("02fd8001").unwrap();
        assert_eq!(result, vec![0x02, 0xfd, 0x80, 0x01]);
    }

    #[test]
    fn test_bytes_to_hex() {
        let bytes = vec![0x02, 0xfd, 0x80, 0x01];
        let result = bytes_to_hex(&bytes);
        assert_eq!(result, "02 fd 80 01");
    }

    #[test]
    fn test_find_bytes() {
        let data = vec![0x01, 0x02, 0x03, 0x04, 0x05];
        let target = vec![0x03, 0x04];
        assert_eq!(find_bytes(&data, &target), Some(2));
        
        let target = vec![0x06, 0x07];
        assert_eq!(find_bytes(&data, &target), None);
    }

    #[test]
    fn test_int_to_bytes() {
        let value = 0x12345678u32;
        let result = int_to_bytes(value);
        assert_eq!(result, vec![0x12, 0x34, 0x56, 0x78]);
    }

    #[test]
    fn test_bytes_to_int() {
        let bytes = vec![0x12, 0x34, 0x56, 0x78];
        let result = bytes_to_int(&bytes).unwrap();
        assert_eq!(result, 0x12345678u32);
    }
}
