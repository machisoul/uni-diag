/**
 * UDS客户端管理器 - 用于React应用
 * 提供高级的UDS诊断服务接口
 */

import { DoipClient, DoipClientConfig } from './DoipClient';
import { UdsService, UdsConfig, UdsResponse } from './UdsService';

export interface DiagnosticResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;
}

export interface ConnectionConfig {
  ipAddress: string;
  port: number;
  serverAddress: string;
  clientAddress: string;
  timeout?: number;
}

export class UdsClientManager {
  private doipClient: DoipClient | null = null;
  private udsService: UdsService | null = null;
  private isConnected: boolean = false;
  private connectionConfig: ConnectionConfig | null = null;

  /**
   * 连接到ECU
   */
  async connect(config: ConnectionConfig): Promise<DiagnosticResult> {
    try {
      this.connectionConfig = config;

      const doipConfig: DoipClientConfig = {
        ipAddress: config.ipAddress,
        port: config.port,
        timeout: config.timeout || 30000
      };

      this.doipClient = new DoipClient(doipConfig);

      const connected = await this.doipClient.connect();
      if (!connected) {
        return {
          success: false,
          message: '连接ECU失败',
          timestamp: new Date().toISOString()
        };
      }

      // 创建UDS服务
      const udsConfig: UdsConfig = {
        vehicleInfo: {
          serverAddress: config.serverAddress,
          clientAddress: config.clientAddress
        }
      };

      this.udsService = new UdsService(this.doipClient, udsConfig);

      // 执行路由激活
      const routineActive = await this.udsService.routineActive();
      if (!routineActive) {
        await this.disconnect();
        return {
          success: false,
          message: '路由激活失败',
          timestamp: new Date().toISOString()
        };
      }

      this.isConnected = true;
      return {
        success: true,
        message: `成功连接到ECU ${config.ipAddress}:${config.port}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `连接失败: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<DiagnosticResult> {
    try {
      if (this.doipClient) {
        await this.doipClient.disconnect();
        this.doipClient = null;
      }

      this.udsService = null;
      this.isConnected = false;

      return {
        success: true,
        message: '已断开ECU连接',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `断开连接失败: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 检查连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.doipClient?.isSocketConnected() === true;
  }

  /**
   * 发送UDS命令
   */
  async sendUdsCommand(serviceId: string, data: string): Promise<DiagnosticResult> {
    if (!this.udsService || !this.isConnected) {
      return {
        success: false,
        message: '未连接到ECU',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const service = parseInt(serviceId.replace('0x', ''), 16);
      const dataBytes = this.hexStringToBytes(data);

      let result: boolean | UdsResponse;
      let message: string;

      switch (service) {
        case 0x10: // 诊断会话控制
          const session = dataBytes.length > 1 ? dataBytes[1] : 0x01;
          result = await this.udsService.startSession(session);
          message = result ? '会话控制成功' : '会话控制失败';
          break;

        case 0x11: // ECU重启
          const resetType = dataBytes.length > 1 ? dataBytes[1] : 0x01;
          result = await this.udsService.ecuReset(resetType);
          message = result ? 'ECU重启成功' : 'ECU重启失败';
          break;

        case 0x14: // 清除DTC
          result = await this.udsService.clearDiagnosticInformation();
          message = result ? '清除DTC成功' : '清除DTC失败';
          break;

        case 0x19: // 读取DTC信息
          const subFunc = dataBytes.length > 1 ? dataBytes[1] : 0x02;
          result = await this.udsService.readDtcInformation(subFunc);
          message = result.success ? '读取DTC信息成功' : '读取DTC信息失败';
          break;

        case 0x22: // 读取数据标识符
          if (dataBytes.length >= 3) {
            const did = (dataBytes[1] << 8) | dataBytes[2];
            result = await this.udsService.readDataByIdentifier(did);
            message = result.success ? `读取DID 0x${did.toString(16)}成功` : `读取DID 0x${did.toString(16)}失败`;
          } else {
            throw new Error('DID参数不足');
          }
          break;

        case 0x27: // 安全访问
          if (dataBytes.length >= 2) {
            const level = dataBytes[1];
            if (level % 2 === 1) {
              // 奇数级别：获取种子
              result = await this.udsService.securityAccessGetSeed(level);
              message = result ? '获取安全访问种子成功' : '获取安全访问种子失败';
            } else {
              // 偶数级别：发送密钥（这里需要实际的密钥计算）
              const key = 0x1234; // 示例密钥，实际应用中需要正确计算
              result = await this.udsService.securityAccessCompareKey(level, key);
              message = result ? '安全访问验证成功' : '安全访问验证失败';
            }
          } else {
            throw new Error('安全访问级别参数不足');
          }
          break;

        case 0x28: // 通信控制
          const commType = dataBytes.length > 1 ? dataBytes[1] : 0x00;
          result = await this.udsService.communicationControl(commType);
          message = result ? '通信控制成功' : '通信控制失败';
          break;

        case 0x2E: // 写入数据标识符
          if (dataBytes.length >= 3) {
            const did = (dataBytes[1] << 8) | dataBytes[2];
            const writeData = new TextDecoder().decode(dataBytes.slice(3));
            result = await this.udsService.writeDataByIdentifier(did, writeData);
            message = result.success ? `写入DID 0x${did.toString(16)}成功` : `写入DID 0x${did.toString(16)}失败`;
          } else {
            throw new Error('写入DID参数不足');
          }
          break;

        case 0x3E: // 测试器在线
          const suppressResp = dataBytes.length > 1 && dataBytes[1] === 0x80;
          result = await this.udsService.testerPresent(suppressResp);
          message = result ? '测试器在线成功' : '测试器在线失败';
          break;

        case 0x85: // 控制DTC设置
          const dtcType = dataBytes.length > 1 ? dataBytes[1] : 0x02;
          result = await this.udsService.controlDtcSetting(dtcType);
          message = result ? 'DTC控制成功' : 'DTC控制失败';
          break;

        default:
          throw new Error(`不支持的UDS服务: 0x${service.toString(16)}`);
      }

      const success = typeof result === 'boolean' ? result : result.success;
      const responseData = typeof result === 'object' ? result.data : undefined;

      return {
        success,
        message,
        data: responseData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `UDS命令执行失败: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取连接配置
   */
  getConnectionConfig(): ConnectionConfig | null {
    return this.connectionConfig;
  }

  /**
   * 工具函数：十六进制字符串转字节数组
   */
  private hexStringToBytes(hex: string): Uint8Array {
    const cleanHex = hex.replace(/\s+/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}

// 创建全局实例
export const udsClientManager = new UdsClientManager();
