/** Serialises async jobs; each job gets a timeout so a lost reply can't wedge the radio. */
export class CommandQueue {
  private tail: Promise<unknown> = Promise.resolve();

  constructor(private readonly timeoutMs = 10_000) {}

  run<T>(job: () => Promise<T>, timeoutMs = this.timeoutMs): Promise<T> {
    const result = this.tail.then(() => withTimeout(job(), timeoutMs));
    this.tail = result.catch(() => undefined);
    return result;
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Radio did not respond in time')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error ?? new Error('Radio returned an error')); },
    );
  });
}
