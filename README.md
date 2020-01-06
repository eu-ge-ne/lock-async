# lock-async

## About

Dead simple async lock. Written in TypeScript. With [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)

## Install

```bash
$ npm install @eu-ge-ne/lock-async
```

## Example

Swap 2 values in async functions concurrently:

```typescript
import { LockAsync } from "@eu-ge-ne/lock-async";

const lock = new LockAsync();

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

let a = 1;
let b = 2;

const first = lock.run(async () => {
    await wait();
    const c = a;
    await wait();
    a = b;
    await wait();
    b = c;
});

const second = lock.run(async () => {
    await wait();
    const c = a;
    await wait();
    a = b;
    await wait();
    b = c;
});

await Promise.all([first, second]);
```

## API

### Create instance

Constructor parameters:

 0. `timeout: number // default = 3000`
 1. `base: number // default = 1`
 2. `ceiling: number // default = 10`

```typescript
import { LockAsync } from "@eu-ge-ne/lock-async";

const lock1 = new LockAsync(3000, 1, 10);

// or

const lock2 = new LockAsync();
```

### Run async function

```typescript
import assert from "assert";

const result = await lock.run(() => new Promise(resolve => setTimeout(() => resolve("Result"), 100)));

assert.strict.equal(result, "Result");
```

### Get status

```typescript
const { locked, waiters } = lock.status();
```

 - `locked: boolean` - lock state
 - `waiters: number` - number of lock waiters

## License

[MIT](LICENSE)
