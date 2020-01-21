import dbg from "debug";

const debug = dbg("LockAsync");

export type Status = {
    locked: boolean;
    waiters: number;
    maxWaiters: number;
    maxLockWaitTime: number;
    maxLockAttempts: number;
};

export class LockAsync {
    private locked = false;
    private waiters = 0;
    private maxWaiters = 0;
    private maxLockWaitTime = 0;
    private maxLockAttempts = 0;

    public constructor(
        private timeout = 3_000,
        private base = 1,
        private ceiling = 10,
    ) {
        debug("timeout: %d ms; base: %d ms; ceiling: %d; max wait time: %d ms",
            this.timeout, this.base, this.ceiling, ((2 ** this.ceiling) - 1) * base);
    }

    public async run<T>(fn: () => Promise<T>): Promise<T> {
        const started = Date.now();
        let attempt = 0;
        let timeLeft = 0;

        this.waiters += 1;
        this.maxWaiters = Math.max(this.maxWaiters, this.waiters);

        do {
            attempt += 1;
            this.maxLockAttempts = Math.max(this.maxLockAttempts, attempt);

            if (!this.locked) {
                debug("run: locking");

                this.maxLockWaitTime = Math.max(this.maxLockWaitTime, Date.now() - started);
                this.locked = true;
                this.waiters -= 1;

                try {
                    return await fn();
                }
                finally {
                    this.locked = false;
                }
            }

            timeLeft = this.timeout - (Date.now() - started);
            debug("run: attempt: %d; timeLeft: %d ms", attempt, timeLeft);

            if (timeLeft > 0) {
                await new Promise(x => setTimeout(x, this.getWaitTime(attempt, timeLeft)));
            }
        } while (timeLeft > 0)

        this.maxLockWaitTime = Math.max(this.maxLockWaitTime, Date.now() - started);
        this.waiters -= 1;

        throw new Error(`Lock timeout ${this.timeout} ms`);
    }

    public status(): Status {
        return {
            locked: this.locked,
            waiters: this.waiters,
            maxWaiters: this.maxWaiters,
            maxLockWaitTime: this.maxLockWaitTime,
            maxLockAttempts: this.maxLockAttempts,
        };
    }

    private getWaitTime(attempt: number, timeLeft: number): number {
        const c = Math.floor(Math.min(attempt, this.ceiling));
        const k = Math.floor(Math.random() * (2 ** c));
        const waitTime = Math.min(k * this.base, timeLeft);
        debug("getWaitTime: attempt: %d; timeLeft: %d ms; waitTime: %d ms", attempt, timeLeft, waitTime);
        return waitTime;
    }
}
