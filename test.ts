import anyTest, { TestInterface } from "ava";

import { LockAsync } from "./index";

const test = anyTest as TestInterface<{
    lock: LockAsync;
}>;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.beforeEach(t => {
    t.context.lock = new LockAsync(200, 1, 10);
});

test("Is a constructor", t => {
    const lock = new LockAsync();

    t.assert(lock instanceof LockAsync);
});

test("Is not locked", t => {
    const lock = t.context.lock;

    const { locked } = lock.status();
    t.false(locked);
});

test("Has 0 waiters", t => {
    const lock = t.context.lock;

    const { waiters } = lock.status();
    t.is(waiters, 0);
});

test("Returns result", async t => {
    const lock = t.context.lock;

    const result = await lock.run(async () => "Hello");
    t.is(result, "Hello");
});

test("Returns async result", async t => {
    const lock = t.context.lock;

    const result = await lock.run(() => new Promise(resolve => setTimeout(() => resolve("Async Hello"), 100)));
    t.is(result, "Async Hello");
});

test("First client does not wait", async t => {
    const lock = t.context.lock;

    const first = lock.run(() => wait(10));
    const { waiters } = lock.status();
    t.is(waiters, 0);

    await first;
});

test("Second client does wait", async t => {
    const lock = t.context.lock;

    const first = lock.run(() => wait(10));
    t.is(lock.status().waiters, 0);

    const second = lock.run(() => wait(10));
    t.is(lock.status().waiters, 1);

    await Promise.all([first, second]);

    t.is(lock.status().waiters, 0);
});

test("status().maxWaitTime increases over time", async t => {
    const lock = t.context.lock;

    t.is(lock.status().maxLockWaitTime, 0);

    const first = lock.run(() => wait(100));
    await lock.run(() => wait(1));

    t.assert(lock.status().maxLockWaitTime >= 100);

    await first;
});

test("First client locks", async t => {
    const lock = t.context.lock;

    const first = lock.run(() => wait(10));
    t.true(lock.status().locked);

    await first;

    t.false(lock.status().locked);
});

test("First throws exception from run", async t => {
    const lock = t.context.lock;

    await t.throwsAsync(async () => {
        await lock.run(async () => {
            await wait(10);
            throw new Error("Error after waiting 10ms");
        });
    }, { instanceOf: Error, message: "Error after waiting 10ms" });
});

test("Second throws exception from run", async t => {
    const lock = t.context.lock;

    const first = lock.run(() => wait(100));

    await t.throwsAsync(async () => {
        await lock.run(async () => {
            await wait(10);
            throw new Error("Error after waiting 10ms");
        });
    }, { instanceOf: Error, message: "Error after waiting 10ms" });

    await first;
});

test("Exception does unlock", async t => {
    const lock = t.context.lock;

    await t.throwsAsync(async () => {
        await lock.run(async () => {
            await wait(10);
            throw new Error();
        });
    });

    t.false(lock.status().locked);
});

test("Second throws error after timeout", async t => {
    const lock = t.context.lock;

    const first = lock.run(() => wait(250));

    await t.throwsAsync(async () => {
        await lock.run(async () => { });
    }, { instanceOf: Error, message: "Lock timeout 200 ms" });

    await first;
});

test("Second does not throw error before timeout", async t => {
    const lock = t.context.lock;

    const first = lock.run(() => wait(50));

    await t.notThrowsAsync(async () => {
        await lock.run(async () => { });
    });

    await first;
});

test("Swap two variables", async t => {
    const lock = t.context.lock;

    let a = 1;
    let b = 2;

    const first = lock.run(async () => {
        await wait(10);
        const c = a;
        await wait(10);
        a = b;
        await wait(10);
        b = c;
    });

    const second = lock.run(async () => {
        await wait(10);
        const c = a;
        await wait(10);
        a = b;
        await wait(10);
        b = c;
    });

    await Promise.all([first, second]);

    t.is(a, 1);
    t.is(b, 2);
});
