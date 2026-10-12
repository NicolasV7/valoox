/** Invocation-local, never a global counter shared between requests. */
export class Budget {
  used = 0;
  constructor(readonly maximum = 48) {}
  get left(): number {
    return this.maximum - this.used;
  }
  take(): void {
    if (this.left <= 0) throw new Exhausted();
    this.used++;
  }
}
export class Exhausted extends Error {
  constructor() {
    super('outbound budget exhausted');
    this.name = 'Exhausted';
  }
}
