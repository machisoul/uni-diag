/**
 * UDS服务 - TypeScript实现
 * 提供完整的UDS诊断服务功能
 */

import { DoipClient, hexToBytes } from './DoipClient';
import { SecurityAccessAlgorithm } from './SecurityAccessAlgorithm';

export interface VehicleConfig {
  serverAddress: string;
  clientAddress: string;
}

export interface UdsConfig {
  vehicleInfo: VehicleConfig;
}

export interface UdsResponse {
  success: boolean;
  data?: Uint8Array;
  error?: string;
}

export class UdsService {
  private client: DoipClient;
  private securityAlgorithm: SecurityAccessAlgorithm;
  private securityAccessSeed: Uint8Array = new Uint8Array(0);
  private serverAddress: Uint8Array;
  private clientAddress: Uint8Array;
  private doipHeadBytes: Uint8Array;
  private doipAddressBytes: Uint8Array;
  private reverseDoipAddressBytes: Uint8Array;

  constructor(client: DoipClient, config: UdsConfig) {
    this.client = client;
    this.securityAlgorithm = new SecurityAccessAlgorithm();

    // 解析地址配置
    this.serverAddress = this.hexToAddressBytes(config.vehicleInfo.serverAddress);
    this.clientAddress = this.hexToAddressBytes(config.vehicleInfo.clientAddress);

    // DoIP协议头
    this.doipHeadBytes = hexToBytes("02 fd 80 01");

    // 组合地址字节
    this.doipAddressBytes = new Uint8Array([
      ...this.clientAddress,
      ...this.serverAddress
    ]);

    this.reverseDoipAddressBytes = new Uint8Array([
      ...this.serverAddress,
      ...this.clientAddress
    ]);
  }

  /**
   * 将十六进制地址字符串转换为字节数组
   */
  private hexToAddressBytes(hexStr: string): Uint8Array {
    const value = parseInt(hexStr, 16);
    return new Uint8Array([
      (value >> 8) & 0xFF,
      value & 0xFF
    ]);
  }

  /**
   * 处理DoIP接收数据
   */
  private async doipReceiveHandle(service: Uint8Array): Promise<Uint8Array | null> {
    try {
      while (true) {
        const data = await this.client.receive();
        if (!data) {
          continue;
        }

        // 检查连续帧
        const startMarker = this.doipHeadBytes;
        if (this.isContinuousFrames(data, startMarker)) {
          const lastFrame = this.extractLastFrame(data, startMarker);
          if (lastFrame) {
            return lastFrame;
          }
        }

        // 检查7F 78响应（请求正确接收-响应挂起）
        const target78 = new Uint8Array([0x7f, ...service, 0x78]);
        if (this.findBytes(data, target78) !== -1) {
          continue;
        }

        // 检查7F 21响应（忙-请求序列错误）
        const target21 = new Uint8Array([0x7f, ...service, 0x21]);
        if (this.findBytes(data, target21) !== -1) {
          continue;
        }

        // 检查地址响应
        const addressTarget = new Uint8Array([...this.reverseDoipAddressBytes, 0x00]);
        if (this.endsWith(data, addressTarget)) {
          continue;
        }

        if (data.length > 0) {
          return data;
        }
      }
    } catch (error) {
      this.log('error', `DoIP receive error: ${error}`);
      return null;
    }
  }

  /**
   * 路由激活
   */
  async routineActive(): Promise<boolean> {
    try {
      const request = hexToBytes("02 fd 00 05 00 00 00 0b 0e 80 00 00 00 00 00 ff ff ff ff");

      if (!await this.client.send(request)) {
        return false;
      }

      const response = await this.doipReceiveHandle(hexToBytes("00"));
      if (!response) {
        return false;
      }

      // 检查响应
      const expectedStart = new Uint8Array([
        ...hexToBytes("02 fd 00 06 00 00 00 09"),
        ...this.doipAddressBytes,
        ...hexToBytes("10 00 00 00 00")
      ]);

      if (this.startsWith(response, expectedStart)) {
        this.log('info', 'Routine active granted');
        return true;
      } else {
        this.log('error', 'Routine active denied or error occurred');
        return false;
      }
    } catch (error) {
      this.log('error', `Routine active failed: ${error}`);
      return false;
    }
  }

  /**
   * 启动诊断会话
   */
  async startSession(session: number): Promise<boolean> {
    try {
      const requestLengthBytes = hexToBytes("00 00 00 06");
      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const request = new Uint8Array([
        ...doipRequestBytes,
        0x10,
        session
      ]);

      if (!await this.client.send(request)) {
        return false;
      }

      if (session > 0x03) {
        return true;
      }

      const response = await this.doipReceiveHandle(hexToBytes("10"));
      if (!response) {
        return false;
      }

      // 检查正响应
      if (this.findBytes(response, hexToBytes("50")) !== -1) {
        this.log('info', 'Start session granted');
        return true;
      } else {
        this.log('error', 'Start session denied or error occurred');
        return false;
      }
    } catch (error) {
      this.log('error', `Start session failed: ${error}`);
      return false;
    }
  }

  /**
   * 控制DTC设置
   */
  async controlDtcSetting(type: number): Promise<boolean> {
    try {
      const requestLengthBytes = hexToBytes("00 00 00 06");
      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const request = new Uint8Array([
        ...doipRequestBytes,
        0x85,
        type
      ]);

      if (!await this.client.send(request)) {
        return false;
      }

      const response = await this.doipReceiveHandle(hexToBytes("85"));
      if (!response) {
        return false;
      }

      // 检查正响应
      if (this.findBytes(response, hexToBytes("c5")) !== -1) {
        this.log('info', 'Control DTC setting granted');
        return true;
      } else {
        this.log('error', 'Control DTC setting denied or error occurred');
        return false;
      }
    } catch (error) {
      this.log('error', `Control DTC setting failed: ${error}`);
      return false;
    }
  }

  /**
   * 通信控制
   */
  async communicationControl(type: number): Promise<boolean> {
    try {
      const requestLengthBytes = hexToBytes("00 00 00 07");
      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const request = new Uint8Array([
        ...doipRequestBytes,
        0x28,
        type,
        0x03
      ]);

      if (!await this.client.send(request)) {
        return false;
      }

      if (type > 0x80) {
        return true;
      }

      const response = await this.doipReceiveHandle(hexToBytes("28"));
      if (!response) {
        return false;
      }

      // 检查正响应
      if (this.findBytes(response, hexToBytes("68")) !== -1) {
        this.log('info', 'Communication control granted');
        return true;
      } else {
        this.log('error', 'Communication control denied or error occurred');
        return false;
      }
    } catch (error) {
      this.log('error', `Communication control failed: ${error}`);
      return false;
    }
  }

  /**
   * 工具函数：查找字节序列
   */
  private findBytes(data: Uint8Array, target: Uint8Array): number {
    for (let i = 0; i <= data.length - target.length; i++) {
      let found = true;
      for (let j = 0; j < target.length; j++) {
        if (data[i + j] !== target[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 工具函数：检查是否以指定字节序列开始
   */
  private startsWith(data: Uint8Array, prefix: Uint8Array): boolean {
    if (data.length < prefix.length) {
      return false;
    }
    for (let i = 0; i < prefix.length; i++) {
      if (data[i] !== prefix[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * 工具函数：检查是否以指定字节序列结束
   */
  private endsWith(data: Uint8Array, suffix: Uint8Array): boolean {
    if (data.length < suffix.length) {
      return false;
    }
    const start = data.length - suffix.length;
    for (let i = 0; i < suffix.length; i++) {
      if (data[start + i] !== suffix[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * 工具函数：检查是否为连续帧
   */
  private isContinuousFrames(data: Uint8Array, startMarker: Uint8Array): boolean {
    let count = 0;
    let pos = 0;

    while (pos < data.length) {
      const found = this.findBytes(data.slice(pos), startMarker);
      if (found === -1) {
        break;
      }
      count++;
      pos = pos + found + 1;
    }

    return count > 1;
  }

  /**
   * 工具函数：提取最后一帧
   */
  private extractLastFrame(data: Uint8Array, startMarker: Uint8Array): Uint8Array | null {
    let lastIndex = -1;
    let pos = 0;

    while (true) {
      const found = this.findBytes(data.slice(pos), startMarker);
      if (found === -1) {
        break;
      }
      lastIndex = pos + found;
      pos = lastIndex + 1;
    }

    if (lastIndex === -1) {
      return null;
    }

    return data.slice(lastIndex);
  }

  /**
   * 读取数据标识符
   */
  async readDataByIdentifier(did: number): Promise<UdsResponse> {
    try {
      const requestLengthBytes = hexToBytes("00 00 00 07");
      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const didBytes = new Uint8Array([
        (did >> 8) & 0xFF,
        did & 0xFF
      ]);

      const request = new Uint8Array([
        ...doipRequestBytes,
        0x22,
        ...didBytes
      ]);

      if (!await this.client.send(request)) {
        return { success: false, error: 'Failed to send request' };
      }

      const response = await this.doipReceiveHandle(hexToBytes("22"));
      if (!response) {
        return { success: false, error: 'No response received' };
      }

      // 检查正响应
      if (this.findBytes(response, hexToBytes("62")) !== -1) {
        this.log('info', `Read data identifier 0x${did.toString(16)} granted`);
        this.bytesToAscii(response, new Uint8Array([0x62, ...didBytes]));
        return { success: true, data: response };
      } else {
        this.log('error', `Read data identifier 0x${did.toString(16)} denied or error occurred`);
        return { success: false, error: 'Request denied' };
      }
    } catch (error) {
      this.log('error', `Read data identifier failed: ${error}`);
    }
  }

  /**
   * 写入数据标识符
   */
  async writeDataByIdentifier(did: number, data: string): Promise<UdsResponse> {
    try {
      const dataBytes = new TextEncoder().encode(data);
      const dataLen = dataBytes.length + 7;
      const requestLengthBytes = this.intToBytes(dataLen);

      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const didBytes = new Uint8Array([
        (did >> 8) & 0xFF,
        did & 0xFF
      ]);

      const request = new Uint8Array([
        ...doipRequestBytes,
        0x2E,
        ...didBytes,
        ...dataBytes
      ]);

      if (!await this.client.send(request)) {
        return { success: false, error: 'Failed to send request' };
      }

      const response = await this.doipReceiveHandle(hexToBytes("2E"));
      if (!response) {
        return { success: false, error: 'No response received' };
      }

      // 检查正响应
      if (this.findBytes(response, hexToBytes("6E")) !== -1) {
        this.log('info', `Write data identifier 0x${did.toString(16)} granted`);
        return { success: true, data: response };
      } else {
        this.log('error', `Write data identifier 0x${did.toString(16)} denied or error occurred`);
        return { success: false, error: 'Request denied' };
      }
    } catch (error) {
      this.log('error', `Write data identifier failed: ${error}`);
    }
  }

  /**
   * 安全访问 - 获取种子
   */
  async securityAccessGetSeed(level: number): Promise<boolean> {
    try {
      const requestLengthBytes = hexToBytes("00 00 00 06");
      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const request = new Uint8Array([
        ...doipRequestBytes,
        0x27,
        level
      ]);

      if (!await this.client.send(request)) {
        return false;
      }

      const response = await this.doipReceiveHandle(hexToBytes("27"));
      if (!response) {
        return false;
      }

      if (this.findBytes(response, hexToBytes("67")) !== -1) {
        this.log('info', 'Security access get seed granted');
        // 提取最后4个字节作为种子
        this.securityAccessSeed = response.slice(-4);
        this.printHex(this.securityAccessSeed);
        return true;
      } else {
        this.log('error', 'Security access get seed denied or error occurred');
        return false;
      }
    } catch (error) {
      this.log('error', `Security access get seed failed: ${error}`);
      return false;
    }
  }

  /**
   * 安全访问 - 比较密钥
   */
  async securityAccessCompareKey(level: number, key: number): Promise<boolean> {
    try {
      if (this.securityAccessSeed.length === 0) {
        this.log('error', 'No seed available, call getSeed first');
        return false;
      }

      // 将种子转换为数字
      const seedValue = this.bytesToInt(this.securityAccessSeed);
      let token: number;

      // 根据级别计算token
      switch (level) {
        case 2:
          token = this.securityAlgorithm.computeKeyLevel1(seedValue, key);
          this.log('info', 'Security access compute level1 compare key');
          break;
        case 4:
          token = this.securityAlgorithm.computeKeyLevel2(seedValue, key);
          this.log('info', 'Security access compute level2 compare key');
          break;
        case 6:
          token = this.securityAlgorithm.computeKeyLevel3(seedValue, key);
          this.log('info', 'Security access compute level3 compare key');
          break;
        case 8:
          token = this.securityAlgorithm.computeKeyLevel4(seedValue, key);
          this.log('info', 'Security access compute level4 compare key');
          break;
        default:
          this.log('error', `Unsupported security level: ${level}`);
          return false;
      }

      const requestLengthBytes = hexToBytes("00 00 00 0a");
      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const tokenBytes = this.intToBytes(token);
      const request = new Uint8Array([
        ...doipRequestBytes,
        0x27,
        level,
        ...tokenBytes
      ]);

      if (!await this.client.send(request)) {
        return false;
      }

      const response = await this.doipReceiveHandle(hexToBytes("27"));
      if (!response) {
        return false;
      }

      if (this.findBytes(response, hexToBytes("67")) !== -1) {
        this.log('info', 'Security access compare key granted');
        return true;
      } else {
        this.log('error', 'Security access compare key denied or error occurred');
        return false;
      }
    } catch (error) {
      this.log('error', `Security access compare key failed: ${error}`);
      return false;
    }
  }

  /**
   * ECU复位
   */
  async ecuReset(resetType: number = 0x01): Promise<boolean> {
    try {
      const requestLengthBytes = hexToBytes("00 00 00 06");
      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const request = new Uint8Array([
        ...doipRequestBytes,
        0x11,
        resetType
      ]);

      if (!await this.client.send(request)) {
        return false;
      }

      const response = await this.doipReceiveHandle(hexToBytes("11"));
      if (!response) {
        return false;
      }

      if (this.findBytes(response, hexToBytes("51")) !== -1) {
        this.log('info', 'ECU Reset granted');
        return true;
      } else {
        this.log('error', 'ECU Reset denied or error occurred');
        return false;
      }
    } catch (error) {
      this.log('error', `ECU Reset failed: ${error}`);
      return false;
    }
  }

  /**
   * 读取DTC信息
   */
  async readDtcInformation(subFunction: number = 0x02): Promise<UdsResponse> {
    try {
      const requestLengthBytes = hexToBytes("00 00 00 07");
      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const request = new Uint8Array([
        ...doipRequestBytes,
        0x19,
        subFunction,
        0xAF
      ]);

      if (!await this.client.send(request)) {
        return { success: false, error: 'Failed to send request' };
      }

      const response = await this.doipReceiveHandle(hexToBytes("19"));
      if (!response) {
        return { success: false, error: 'No response received' };
      }

      if (this.findBytes(response, hexToBytes("59")) !== -1) {
        this.log('info', 'Read DTC information granted');
        return { success: true, data: response };
      } else {
        this.log('error', 'Read DTC information denied or error occurred');
        return { success: false, error: 'Request denied' };
      }
    } catch (error) {
      this.log('error', `Read DTC information failed: ${error}`);
    }
  }

  /**
   * 清除诊断信息
   */
  async clearDiagnosticInformation(): Promise<boolean> {
    try {
      const requestLengthBytes = hexToBytes("00 00 00 08");
      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const request = new Uint8Array([
        ...doipRequestBytes,
        0x14,
        0xFF, 0xFF, 0xFF // 清除所有DTC
      ]);

      if (!await this.client.send(request)) {
        return false;
      }

      const response = await this.doipReceiveHandle(hexToBytes("14"));
      if (!response) {
        return false;
      }

      if (this.findBytes(response, hexToBytes("54")) !== -1) {
        this.log('info', 'Clear diagnostic information granted');
        return true;
      } else {
        this.log('error', 'Clear diagnostic information denied or error occurred');
        return false;
      }
    } catch (error) {
      this.log('error', `Clear diagnostic information failed: ${error}`);
      return false;
    }
  }

  /**
   * 测试器在线
   */
  async testerPresent(suppressResponse: boolean = false): Promise<boolean> {
    try {
      const requestLengthBytes = hexToBytes("00 00 00 06");
      const doipRequestBytes = new Uint8Array([
        ...this.doipHeadBytes,
        ...requestLengthBytes,
        ...this.doipAddressBytes
      ]);

      const subFunction = suppressResponse ? 0x80 : 0x00;
      const request = new Uint8Array([
        ...doipRequestBytes,
        0x3E,
        subFunction
      ]);

      if (!await this.client.send(request)) {
        return false;
      }

      if (suppressResponse) {
        return true; // 抑制响应模式，不等待响应
      }

      const response = await this.doipReceiveHandle(hexToBytes("3E"));
      if (!response) {
        return false;
      }

      if (this.findBytes(response, hexToBytes("7E")) !== -1) {
        this.log('info', 'Tester present granted');
        return true;
      } else {
        this.log('error', 'Tester present denied or error occurred');
        return false;
      }
    } catch (error) {
      this.log('error', `Tester present failed: ${error}`);
      return false;
    }
  }

  /**
   * 工具函数：将字节转换为ASCII
   */
  private bytesToAscii(data: Uint8Array, targetSequence: Uint8Array): void {
    const startIndex = this.findBytes(data, targetSequence);
    if (startIndex !== -1) {
      const asciiBytes = data.slice(startIndex + targetSequence.length);
      try {
        const asciiStr = new TextDecoder('utf-8').decode(asciiBytes);
        this.log('info', `Read data identifier transform ascii: ${asciiStr}`);
      } catch (error) {
        const printableChars: string[] = [];
        for (const byte of asciiBytes) {
          if (byte >= 0x20 && byte <= 0x7E) {
            printableChars.push(String.fromCharCode(byte));
          } else {
            printableChars.push(`\\x${byte.toString(16).padStart(2, '0')}`);
          }
        }
        this.log('info', `Read data identifier transform ascii: ${printableChars.join('')}`);
      }
    } else {
      this.log('error', 'Target sequence not found!');
    }
  }

  /**
   * 工具函数：32位整数转字节数组（大端序）
   */
  private intToBytes(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, value, false); // false表示大端序
    return new Uint8Array(buffer);
  }

  /**
   * 工具函数：字节数组转32位整数（大端序）
   */
  private bytesToInt(bytes: Uint8Array): number {
    if (bytes.length !== 4) {
      throw new Error('Bytes array must be 4 bytes long');
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return view.getUint32(0, false); // false表示大端序
  }

  /**
   * 工具函数：打印十六进制数据
   */
  private printHex(data: Uint8Array, bytesPerLine: number = 32): void {
    for (let i = 0; i < data.length; i += bytesPerLine) {
      const chunk = data.slice(i, i + bytesPerLine);
      const hexStr = Array.from(chunk)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ');
      this.log('info', `0x${i.toString(16).padStart(4, '0')}: ${hexStr}`);
    }
  }

  /**
   * 日志记录
   */
  private log(level: 'info' | 'debug' | 'error', message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [UDS] [${level.toUpperCase()}] ${message}`);
  }
}
