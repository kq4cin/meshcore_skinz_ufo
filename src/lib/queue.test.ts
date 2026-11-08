import { describe, expect, it } from 'vitest';
import { CommandQueue } from './queue';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('CommandQueue', () => {
  it('runs jobs strictly in order', async () => {
    const q = new CommandQueue();
    const log: string[] = [];
    await Promise.all([
      q.run(async () => { log.push('a1'); await delay(20); log.push('a2'); }),
      q.run(async () => { log.push('b1'); log.push('b2'); }),
    ]);
    expect(log).toEqual(['a1', 'a2', 'b1', 'b2']);
  });

  it('times out and keeps going', async () => {
    const q = new CommandQueue(20);
    await expect(q.run(() => new Promise(() => {}))).rejects.toThrow(/respond/);
    await expect(q.run(async () => 7)).resolves.toBe(7);
  });

  it('turns an undefined rejection into an Error', async () => {
    const q = new CommandQueue();
    await expect(q.run(() => Promise.reject())).rejects.toThrow(/error/);
  });
});
