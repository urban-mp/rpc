# FiveM RPC

Type-safe asynchronous RPC for FiveM server, client, and NUI webview runtimes.

[![RPC package](https://img.shields.io/npm/v/@urban-mp/rpc?label=@urban-mp/rpc)](https://www.npmjs.com/package/@urban-mp/rpc)
[![Shared types](https://img.shields.io/npm/v/@urban-mp/rpc-types?label=rpc-types)](https://www.npmjs.com/package/@urban-mp/rpc-types)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)

## Packages

| Package | Purpose |
| --- | --- |
| `@urban-mp/rpc` | Runtime RPC implementation for server, client, and webview. |
| `@urban-mp/rpc-types` | Type declarations for strongly typed event maps. |

## Install

```bash
pnpm add @urban-mp/rpc
pnpm add -D @urban-mp/rpc-types
```

```bash
yarn add @urban-mp/rpc
yarn add -D @urban-mp/rpc-types
```

```bash
bun add @urban-mp/rpc
bun add -d @urban-mp/rpc-types
```

## Usage

```ts
import { RPC } from '@urban-mp/rpc'

export const rpc = new RPC({ env: 'client' }).get()
```

## Documentation

| Guide | Link |
| --- | --- |
| Runtime package | [`rpc/readme.md`](./rpc/readme.md) |
| Shared types package | [`shared-types/readme.md`](./shared-types/readme.md) |

## Features

- Server, client, and webview communication through a single API
- Promise-based request/response calls
- Strongly typed event names, arguments, and return values
- Native FiveM event helpers
- Resource-targeted webview calls

## License

Licensed under the Custom Attribution-NoDerivs Software License.
