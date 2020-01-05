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
        if (!this.locked) {
            return await this.runFn(fn);
        }

        this.waiters += 1;

        const waitUntil = Date.now() + this.timeout;
        let attempt = 1;

        let resolve: (value?: T | PromiseLike<T>) => void;
        let reject: (reason?: any) => void;

        const tryLock = async () => {
            if (!this.locked) {
                this.waiters -= 1;
                resolve(await this.runFn(fn));
                return;
            }

            const timeLeft = waitUntil - Date.now();
            debug("tryLock: attempt: %d; timeLeft: %d ms", attempt, timeLeft);

            if (timeLeft <= 0) {
                this.waiters -= 1;
                reject(new Error(`Lock timeout ${this.timeout} ms`));
                return;
            }

            attempt += 1;
            setTimeout(tryLock, this.getWaitTime(attempt, waitUntil));
        };

        setTimeout(tryLock, this.getWaitTime(attempt, waitUntil));

        return new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });
    }

    public status(): Status {
        return {
            locked: this.locked,
            waiters: this.waiters,
        };
    }

    private async runFn<T>(fn: () => Promise<T>): Promise<T> {
        this.locked = true;
        try {
            return await fn();
        }
        finally {
            this.locked = false;
        }
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
