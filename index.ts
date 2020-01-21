import dbg from "debug";

const debug = dbg("LockAsync");

export type Status = {
    locked: boolean;
    waiters: number;
};

export class LockAsync {
    private locked = false;
    private waiters = 0;

    public constructor(
        private timeout = 3_000,
        private base = 1,
        private ceiling = 10,
    ) {
        debug("timeout: %d ms; base: %d ms; ceiling: %d; max wait time: %d ms",
            this.timeout, this.base, this.ceiling, ((2 ** this.ceiling) - 1) * base);
    }

    public async run<T>(fn: () => Promise<T>): Promise<T> {
        const waitUntil = Date.now() + this.timeout;

        let attempt = 0;
        let timeLeft = 0;

        this.waiters += 1;

        do {
            if (!this.locked) {
                debug("run: locking");

                this.locked = true;
                this.waiters -= 1;

                try {
                    return await fn();
                }
                finally {
                    this.locked = false;
                }
            }

            attempt += 1;
            timeLeft = waitUntil - Date.now();
            debug("run: attempt: %d; timeLeft: %d ms", attempt, timeLeft);

            if (timeLeft > 0) {
                await new Promise(x => setTimeout(x, this.getWaitTime(attempt, waitUntil)));
            }
        } while (timeLeft > 0)

        this.waiters -= 1;

        throw new Error(`Lock timeout ${this.timeout} ms`);
    }

    public status(): Status {
        return {
            locked: this.locked,
            waiters: this.waiters,
        };
    }

    private getWaitTime(attempt: number, waitUntil: number): number {
        const c = Math.floor(Math.min(attempt, this.ceiling));
        const k = Math.floor(Math.random() * (2 ** c));
        const timeLeft = waitUntil - Date.now();
        const waitTime = Math.min(k * this.base, timeLeft);
        debug("getWaitTime: attempt: %d; timeLeft: %d ms; waitTime: %d ms", attempt, timeLeft, waitTime);
        return waitTime;
    }
}
