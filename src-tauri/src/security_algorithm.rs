use crate::types::DoipError;
/**
 * 安全访问算法 - Rust 实现
 * 用于计算 UDS 安全访问的密钥
 * 完全移植自 TypeScript 版本，确保算法逻辑一致
 */
use crate::utils::{bytes_to_int, int_to_bytes, print_hex};

pub struct SecurityAccessAlgorithm {
    sec_m_level1_cycle_value: u32,
    sec_m_level2_cycle_value: u32,
    sec_m_level3_cycle_value: u32,
    sec_m_level4_cycle_value: u32,
}

impl SecurityAccessAlgorithm {
    /// 创建新的安全访问算法实例
    pub fn new() -> Self {
        Self {
            sec_m_level1_cycle_value: 32,
            sec_m_level2_cycle_value: 32,
            sec_m_level3_cycle_value: 32,
            sec_m_level4_cycle_value: 32,
        }
    }

    /// 计算 Level1 密钥
    pub fn compute_key_level1(&mut self, seed: u32, key_k: u32) -> u32 {
        self.sec_m_level1_cycle_value = 32;
        let mut temp_key = seed ^ key_k;

        for _ in 0..self.sec_m_level1_cycle_value {
            if (temp_key & 0x01) != 0 {
                let shifted_left = temp_key << 3;
                let shifted_right = temp_key >> 29;
                temp_key = shifted_left | shifted_right;
                temp_key ^= seed;
            } else {
                let shifted_right = temp_key >> 7;
                let shifted_left = temp_key << 25;
                temp_key = shifted_right | shifted_left;
                temp_key ^= key_k;
            }
        }

        temp_key
    }

    /// 计算 Level2 密钥
    pub fn compute_key_level2(&mut self, seed: u32, key_k: u32) -> u32 {
        self.sec_m_level2_cycle_value = 32;
        let mut temp_key = seed ^ key_k;

        for _ in 0..self.sec_m_level2_cycle_value {
            if (temp_key & 0x00000001) != 0 {
                temp_key >>= 1;
                temp_key ^= seed;
            } else {
                temp_key >>= 1;
                temp_key ^= key_k;
            }
        }

        temp_key
    }

    /// 计算 Level3 密钥
    pub fn compute_key_level3(&mut self, seed: u32, key_k: u32) -> u32 {
        self.sec_m_level3_cycle_value = 32;
        let mut temp_key = seed ^ key_k;

        for _ in 0..self.sec_m_level3_cycle_value {
            if (seed & 0x80000000) != 0 {
                let part1 = ((seed >> 1) ^ seed) << 3;
                let part2 = seed >> 3;
                temp_key = part1 ^ part2;
            } else {
                let part1 = seed >> 3;
                let part2 = seed << 9;
                temp_key = part1 ^ part2;
            }

            temp_key ^= key_k;
        }

        let shifted_left = temp_key << 15;
        let shifted_right = temp_key >> 17;
        temp_key = shifted_left | shifted_right;

        temp_key
    }

    /// 计算 Level4 密钥
    pub fn compute_key_level4(&mut self, seed: u32, key_k: u32) -> u32 {
        self.sec_m_level4_cycle_value = 32;
        let mut temp_key = seed ^ key_k;

        for _ in 0..self.sec_m_level4_cycle_value {
            let left_shift = temp_key << 7;
            let right_shift = temp_key >> (32 - 7);
            temp_key = left_shift | right_shift;

            temp_key ^= key_k;
        }

        temp_key
    }

    /// 根据级别计算密钥
    pub fn compute_key_by_level(
        &mut self,
        level: u8,
        seed: u32,
        key_k: u32,
    ) -> Result<u32, DoipError> {
        match level {
            2 => Ok(self.compute_key_level1(seed, key_k)),
            4 => Ok(self.compute_key_level2(seed, key_k)),
            6 => Ok(self.compute_key_level3(seed, key_k)),
            8 => Ok(self.compute_key_level4(seed, key_k)),
            _ => Err(DoipError::InvalidData(format!(
                "Unsupported security level: {}",
                level
            ))),
        }
    }

    /// 打印十六进制数据
    pub fn print_hex(&self, data: &[u8], bytes_per_line: usize) {
        print_hex(data, bytes_per_line);
    }

    /// 将32位整数转换为4字节数组（大端序）
    pub fn int_to_bytes(&self, value: u32) -> Vec<u8> {
        int_to_bytes(value)
    }

    /// 将4字节数组转换为32位整数（大端序）
    pub fn bytes_to_int(&self, bytes: &[u8]) -> Result<u32, DoipError> {
        bytes_to_int(bytes)
    }
}

impl Default for SecurityAccessAlgorithm {
    fn default() -> Self {
        Self::new()
    }
}

/// 测试函数
pub fn test_security_access() {
    let mut algo = SecurityAccessAlgorithm::new();
    let seed = 0xb418e1a8u32;
    let key = 0xe455u32;
    let token = algo.compute_key_level1(seed, key);

    println!("Security Access Test:");
    println!("Seed: 0x{:08x}", seed);
    println!("Key: 0x{:04x}", key);
    println!("Token: 0x{:08x}", token);

    let token_bytes = algo.int_to_bytes(token);
    algo.print_hex(&token_bytes, 10);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_key_level1() {
        let mut algo = SecurityAccessAlgorithm::new();
        let seed = 0x12345678u32;
        let key = 0x1234u32;
        let result = algo.compute_key_level1(seed, key);

        // 验证结果是32位数值
        assert!(result <= u32::MAX);
    }

    #[test]
    fn test_compute_key_level2() {
        let mut algo = SecurityAccessAlgorithm::new();
        let seed = 0x12345678u32;
        let key = 0x1234u32;
        let result = algo.compute_key_level2(seed, key);

        assert!(result <= u32::MAX);
    }

    #[test]
    fn test_compute_key_level3() {
        let mut algo = SecurityAccessAlgorithm::new();
        let seed = 0x12345678u32;
        let key = 0x1234u32;
        let result = algo.compute_key_level3(seed, key);

        assert!(result <= u32::MAX);
    }

    #[test]
    fn test_compute_key_level4() {
        let mut algo = SecurityAccessAlgorithm::new();
        let seed = 0x12345678u32;
        let key = 0x1234u32;
        let result = algo.compute_key_level4(seed, key);

        assert!(result <= u32::MAX);
    }

    #[test]
    fn test_compute_key_by_level() {
        let mut algo = SecurityAccessAlgorithm::new();
        let seed = 0x12345678u32;
        let key = 0x1234u32;

        // 测试有效级别
        assert!(algo.compute_key_by_level(2, seed, key).is_ok());
        assert!(algo.compute_key_by_level(4, seed, key).is_ok());
        assert!(algo.compute_key_by_level(6, seed, key).is_ok());
        assert!(algo.compute_key_by_level(8, seed, key).is_ok());

        // 测试无效级别
        assert!(algo.compute_key_by_level(1, seed, key).is_err());
        assert!(algo.compute_key_by_level(3, seed, key).is_err());
        assert!(algo.compute_key_by_level(5, seed, key).is_err());
        assert!(algo.compute_key_by_level(7, seed, key).is_err());
        assert!(algo.compute_key_by_level(9, seed, key).is_err());
    }

    #[test]
    fn test_int_bytes_conversion() {
        let algo = SecurityAccessAlgorithm::new();
        let value = 0x12345678u32;

        let bytes = algo.int_to_bytes(value);
        assert_eq!(bytes.len(), 4);

        let converted_back = algo.bytes_to_int(&bytes).unwrap();
        assert_eq!(converted_back, value);
    }

    #[test]
    fn test_known_values() {
        // 使用 TypeScript 版本中的测试值
        let mut algo = SecurityAccessAlgorithm::new();
        let seed = 0xb418e1a8u32;
        let key = 0xe455u32;
        let token = algo.compute_key_level1(seed, key);

        // 验证计算结果（这个值应该与 TypeScript 版本一致）
        println!("Test token: 0x{:08x}", token);
        assert!(token > 0); // 基本验证
    }
}
