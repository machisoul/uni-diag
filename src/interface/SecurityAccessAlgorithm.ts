/**
 * 安全访问算法 - TypeScript实现
 * 用于计算UDS安全访问的密钥
 */

export class SecurityAccessAlgorithm {
  private secMLevel1CycleValue: number = 32;
  private secMLevel2CycleValue: number = 32;
  private secMLevel3CycleValue: number = 32;
  private secMLevel4CycleValue: number = 32;

  /**
   * 计算Level1密钥
   */
  computeKeyLevel1(seed: number, keyK: number): number {
    this.secMLevel1CycleValue = 32;
    let tempKey = (seed ^ keyK) >>> 0; // 无符号32位

    for (let i = 0; i < this.secMLevel1CycleValue; i++) {
      if ((tempKey & 0x01) !== 0) {
        const shiftedLeft = (tempKey << 3) >>> 0;
        const shiftedRight = tempKey >>> 29;
        tempKey = (shiftedLeft | shiftedRight) >>> 0;
        tempKey = (tempKey ^ seed) >>> 0;
      } else {
        const shiftedRight = tempKey >>> 7;
        const shiftedLeft = (tempKey << 25) >>> 0;
        tempKey = (shiftedRight | shiftedLeft) >>> 0;
        tempKey = (tempKey ^ keyK) >>> 0;
      }
    }
    return tempKey >>> 0;
  }

  /**
   * 计算Level2密钥
   */
  computeKeyLevel2(seed: number, keyK: number): number {
    this.secMLevel2CycleValue = 32;
    let tempKey = (seed ^ keyK) >>> 0;

    for (let i = 0; i < this.secMLevel2CycleValue; i++) {
      if ((tempKey & 0x00000001) !== 0) {
        tempKey = tempKey >>> 1;
        tempKey = (tempKey ^ seed) >>> 0;
      } else {
        tempKey = tempKey >>> 1;
        tempKey = (tempKey ^ keyK) >>> 0;
      }
      tempKey = tempKey >>> 0;
    }
    return tempKey;
  }

  /**
   * 计算Level3密钥
   */
  computeKeyLevel3(seed: number, keyK: number): number {
    this.secMLevel3CycleValue = 32;
    let tempKey = (seed ^ keyK) >>> 0;

    for (let i = 0; i < this.secMLevel3CycleValue; i++) {
      if ((seed & 0x80000000) !== 0) {
        const part1 = (((seed >>> 1) ^ seed) << 3) >>> 0;
        const part2 = seed >>> 3;
        tempKey = (part1 ^ part2) >>> 0;
      } else {
        const part1 = seed >>> 3;
        const part2 = (seed << 9) >>> 0;
        tempKey = (part1 ^ part2) >>> 0;
      }

      tempKey = (tempKey ^ keyK) >>> 0;
    }

    const shiftedLeft = (tempKey << 15) >>> 0;
    const shiftedRight = tempKey >>> 17;
    tempKey = (shiftedLeft | shiftedRight) >>> 0;

    return tempKey;
  }

  /**
   * 计算Level4密钥
   */
  computeKeyLevel4(seed: number, keyK: number): number {
    this.secMLevel4CycleValue = 32;
    let tempKey = (seed ^ keyK) >>> 0;

    for (let i = 0; i < this.secMLevel4CycleValue; i++) {
      const leftShift = (tempKey << 7) >>> 0;
      const rightShift = (tempKey >>> (32 - 7)) >>> 0;
      tempKey = (leftShift | rightShift) >>> 0;

      tempKey = (tempKey ^ keyK) >>> 0;
    }

    return tempKey;
  }

  /**
   * 打印十六进制数据
   */
  printHex(data: Uint8Array, bytesPerLine: number = 10): void {
    for (let i = 0; i < data.length; i += bytesPerLine) {
      const chunk = data.slice(i, i + bytesPerLine);
      const hexStr = Array.from(chunk)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ');
      console.log(`0x${i.toString(16).padStart(4, '0')}: ${hexStr}`);
    }
  }

  /**
   * 将32位整数转换为4字节数组（大端序）
   */
  intToBytes(value: number): Uint8Array {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, value, false); // false表示大端序
    return new Uint8Array(buffer);
  }

  /**
   * 将4字节数组转换为32位整数（大端序）
   */
  bytesToInt(bytes: Uint8Array): number {
    if (bytes.length !== 4) {
      throw new Error('Bytes array must be 4 bytes long');
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return view.getUint32(0, false); // false表示大端序
  }
}

/**
 * 测试函数
 */
export function testSecurityAccess(): void {
  const algo = new SecurityAccessAlgorithm();
  const seed = 0xb418e1a8;
  const key = 0xe455;
  const token = algo.computeKeyLevel1(seed, key);
  
  console.log('Security Access Test:');
  console.log(`Seed: 0x${seed.toString(16)}`);
  console.log(`Key: 0x${key.toString(16)}`);
  console.log(`Token: 0x${token.toString(16)}`);
  
  const tokenBytes = algo.intToBytes(token);
  algo.printHex(tokenBytes);
}
