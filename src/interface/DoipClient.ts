/**
 * DoIP客户端 - TypeScript实现
 * 用于与ECU进行DoIP通信
 */

export interface DoipClientConfig {
  ipAddress: string;
  port: number;
  timeout?: number;
}

export class DoipClient {
  private ipAddress: string;
  private port: number;
  private timeout: number;
  private socket: WebSocket | null = null;
  private isConnected: boolean = false;

  constructor(config: DoipClientConfig) {
    this.ipAddress = config.ipAddress;
    this.port = config.port;
    this.timeout = config.timeout || 30000;
  }

  /**
   * 连接到DoIP服务
   */
  async connect(): Promise<boolean> {
    try {
      // 在浏览器环境中，我们使用WebSocket或者通过后端代理
      // 这里提供一个基础实现框架
      const url = `ws://${this.ipAddress}:${this.port}`;

      return new Promise((resolve, reject) => {
        this.socket = new WebSocket(url);

        const timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.timeout);

        this.socket.onopen = () => {
          clearTimeout(timeoutId);
          this.isConnected = true;
          this.log('info', `Connected to ${this.ipAddress}:${this.port}`);
          resolve(true);
        };

        this.socket.onerror = (error) => {
          clearTimeout(timeoutId);
          this.log('error', `Connection failed: ${error}`);
          resolve(false);
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.log('info', 'Connection closed');
        };
      });
    } catch (error) {
      this.log('error', `Connection failed: ${error}`);
      return false;
    }
  }

  /**
   * 发送数据
   */
  async send(data: Uint8Array): Promise<boolean> {
    try {
      if (!this.socket || !this.isConnected) {
        throw new Error('Not connected');
      }

      this.socket.send(data);
      this.log('debug', `Sent ${data.length} bytes`);

      if (data.length < 256) {
        this.printHex(data);
      }

      return true;
    } catch (error) {
      this.log('error', `Send failed: ${error}`);
      return false;
    }
  }

  /**
   * 接收数据
   */
  async receive(): Promise<Uint8Array | null> {
    try {
      if (!this.socket || !this.isConnected) {
        throw new Error('Not connected');
      }

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Receive timeout'));
        }, this.timeout);

        this.socket!.onmessage = (event) => {
          clearTimeout(timeoutId);

          if (event.data instanceof ArrayBuffer) {
            const data = new Uint8Array(event.data);
            this.log('debug', `Received ${data.length} bytes`);

            if (data.length < 256) {
              this.printHex(data);
            }

            resolve(data);
          } else {
            reject(new Error('Invalid data format'));
          }
        };
      });
    } catch (error) {
      this.log('error', `Receive failed: ${error}`);
      return null;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<boolean> {
    try {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
        this.isConnected = false;
        this.log('info', 'Connection closed');
        return true;
      }
      return true;
    } catch (error) {
      this.log('error', `Disconnect failed: ${error}`);
      return false;
    }
  }

  /**
   * 检查连接状态
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * 打印十六进制数据
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
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

/**
 * 十六进制字符串转Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/\s+/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Uint8Array转十六进制字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join(' ');
}

/**
 * 打印十六进制数据的工具函数
 */
export function printHex(data: Uint8Array, bytesPerLine: number = 32): void {
  for (let i = 0; i < data.length; i += bytesPerLine) {
    const chunk = data.slice(i, i + bytesPerLine);
    const hexStr = Array.from(chunk)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(' ');
    console.log(`0x${i.toString(16).padStart(4, '0')}: ${hexStr}`);
  }
}
