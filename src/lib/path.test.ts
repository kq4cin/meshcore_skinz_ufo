import { describe, expect, it } from 'vitest';
import { hopsFromPathLen } from './path';

describe('hopsFromPathLen', () => {
  it('returns hop count for 1-byte path hashes', () => {
    expect(hopsFromPathLen(0)).toBe(0);
    expect(hopsFromPathLen(3)).toBe(3);
  });

  it('strips the path-hash size bits', () => {
    expect(hopsFromPathLen(0x41)).toBe(1); // 2-byte hashes, 1 hop
    expect(hopsFromPathLen(0x82)).toBe(2); // 3-byte hashes, 2 hops
  });

  it('handles signed bytes from readInt8', () => {
    expect(hopsFromPathLen(-127)).toBe(1); // 0x81
    expect(hopsFromPathLen(-1)).toBeNull(); // 0xFF
  });

  it('treats 0xFF and missing values as unknown', () => {
    expect(hopsFromPathLen(0xff)).toBeNull();
    expect(hopsFromPathLen(undefined)).toBeNull();
  });
});
