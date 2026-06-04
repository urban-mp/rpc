# FiveM RPC

Promise-based RPC for FiveM `server`, `client`, and `cef` runtimes.

[![RPC package](https://img.shields.io/npm/v/@urban-mp/rpc?label=@urban-mp/rpc)](https://www.npmjs.com/package/@urban-mp/rpc)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)

## Install

```bash
npm install @urban-mp/rpc
```

## Usage

```ts
import { RPC } from '@urban-mp/rpc'

export const rpc = new RPC({ env: 'client' }).get()

rpc.register('profile:get', async userId => {
	return getProfile(userId)
})

const profile = await rpc.call('server', 'profile:get', userId)
```

## Features

- Single `register` API for handlers
- Single `call` API for server/client/cef calls
- Promise-based request/response calls
- Optional resource override through `resourceName`

## Documentation

See [`rpc/readme.md`](./rpc/readme.md).

## License

Licensed under the Custom Attribution-NoDerivs Software License.
