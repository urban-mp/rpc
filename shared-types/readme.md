# FiveM RPC Shared Types

Shared TypeScript declarations for `@urban-mp/rpc`. This package lets every runtime project use the same event names, argument types, return types, and command names.

[![npm package](https://img.shields.io/npm/v/@urban-mp/rpc-types?label=npm)](https://www.npmjs.com/package/@urban-mp/rpc-types)
[![TypeScript](https://img.shields.io/badge/TypeScript-declarations-3178c6)](https://www.typescriptlang.org/)

## Installation

```bash
pnpm add -D @urban-mp/rpc-types
```

```bash
yarn add -D @urban-mp/rpc-types
```

```bash
bun add -d @urban-mp/rpc-types
```

## Recommended Structure

```text
apps/
  server/
  client/
  webview/
  shared/
    rpc/
      index.d.ts
```

## Declaration File

Create `shared/rpc/index.d.ts`.

```ts
declare module '@urban-mp/rpc-types' {
	export type RPCCommands_Client = 'toggleui'
	export type RPCCommands_Server = 'report'

	export interface RPCEvents_Client {
		'player:getPosition'(): [number, number, number]
	}

	export interface RPCEvents_ClientServer {
		'profile:get'(): { name: string; level: number }
	}

	export interface RPCEvents_ClientWebview {
		'settings:get'(key: string): unknown
	}

	export interface RPCEvents_Server {
		'cache:flush'(): boolean
	}

	export interface RPCEvents_ServerClient {
		'hud:getState'(): { visible: boolean }
	}

	export interface RPCEvents_ServerWebview {
		'modal:confirm'(payload: { title: string }): boolean
	}

	export interface RPCEvents_Webview {
		'theme:get'(): string
	}

	export interface RPCEvents_WebviewClient {
		'camera:getMode'(): string
	}

	export interface RPCEvents_WebviewServer {
		'profile:save'(payload: Record<string, unknown>): boolean
	}
}
```

## TypeScript Setup

Reference the declaration from each runtime `tsconfig.json`.

```json
{
	"compilerOptions": {
		"types": ["../shared/rpc"]
	}
}
```

If your project uses custom type roots, configure them instead.

```json
{
	"compilerOptions": {
		"typeRoots": ["../shared", "../../node_modules/@types"]
	}
}
```

## Result

Typed event maps provide autocomplete and compile-time checks for every RPC method.

```ts
const profile = await rpc.emitServer('profile:get')
```

## License

Licensed under the Custom Attribution-NoDerivs Software License.
