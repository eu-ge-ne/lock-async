# lock-async

## About

Dead simple async lock. Written in TypeScript. With [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)

## Install

```bash
$ npm install @eu-ge-ne/lock-async
```

## Example

```js
import { LockAsync} from "@eu-ge-ne/lock-async";

const lock = new LockAsync();

await Lock.run(() => new Promise(resolve => setTimeout(resolve, 100)));
```

## API

### Create instance

Constructor accepts following parameters:

 - `timeout: number` (default = `3000`)
 - `base: number` (default = `1`)
 - `ceiling: number` (default = `10`)

```js
import { LockAsync} from "@eu-ge-ne/lock-async";

const lock1 = new LockAsync(3000, 1, 10);
// or
const lock2 = new LockAsync();
```

### Run async function

```js
import { LockAsync} from "@eu-ge-ne/lock-async";

const lock = new LockAsync();

await Lock.run(() => new Promise(resolve => setTimeout(resolve, 100)));
```

### Get status

```js
import { LockAsync} from "@eu-ge-ne/lock-async";

const lock = new LockAsync();

const { locked, waiters } = lock.status();
```

## License

[MIT](LICENSE)
