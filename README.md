# lock-async

## About

Dead simple async lock. Written in TypeScript. With [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)

## Install

```bash
$ npm install @eu-ge-ne/lock-async
```

## Example

Swap 2 values in async functions concurrently:

```js
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

Constructor accepts following parameters:

 - `timeout: number` (default = `3000`)
 - `base: number` (default = `1`)
 - `ceiling: number` (default = `10`)

```js
import { LockAsync } from "@eu-ge-ne/lock-async";

const lock1 = new LockAsync(3000, 1, 10);
// or
const lock2 = new LockAsync();
```

### Run async function

```js
import { LockAsync } from "@eu-ge-ne/lock-async";

const lock = new LockAsync();

await Lock.run(() => new Promise(resolve => setTimeout(resolve, 100)));
```

### Get status

```js
import { LockAsync } from "@eu-ge-ne/lock-async";

const lock = new LockAsync();

const { locked, waiters } = lock.status();
```

## License

[MIT](LICENSE)
