interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private maxAllowedPerWindow: number = 3;
  private windowMs: number = 24 * 60 * 60 * 1000; // 24 hours

  public check(clientIp: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.records.get(clientIp);

    if (!record || now > record.resetAt) {
      // First access or expired window
      return {
        allowed: true,
        remaining: this.maxAllowedPerWindow,
        resetAt: now + this.windowMs
      };
    }

    const remaining = Math.max(0, this.maxAllowedPerWindow - record.count);
    return {
      allowed: record.count < this.maxAllowedPerWindow,
      remaining,
      resetAt: record.resetAt
    };
  }

  public increment(clientIp: string): void {
    const now = Date.now();
    const record = this.records.get(clientIp);

    if (!record || now > record.resetAt) {
      this.records.set(clientIp, {
        count: 1,
        resetAt: now + this.windowMs
      });
    } else {
      record.count += 1;
    }
  }

  public getRemaining(clientIp: string): number {
    return this.check(clientIp).remaining;
  }
}

export const rateLimiter = new RateLimiter();
