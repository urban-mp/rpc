# FiveM RPC

Type-safe asynchronous RPC for FiveM resources. Use one small API to communicate between server, client, and NUI webview code with request/response semantics.

[![npm package](https://img.shields.io/npm/v/@urban-mp/rpc?label=npm)](https://www.npmjs.com/package/@urban-mp/rpc)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)
[![FiveM](https://img.shields.io/badge/FiveM-runtime-orange)](https://fivem.net/)

## Highlights

- Promise-based calls across `server`, `client`, and `webview`
- Strict TypeScript support through `@urban-mp/rpc-types`
- One RPC instance per runtime environment
- Native FiveM event helpers for client and server runtimes
- Resource-targeted NUI calls from webview code

## Installation

```bash
pnpm add @urban-mp/rpc
```

```bash
yarn add @urban-mp/rpc
```

```bash
bun add @urban-mp/rpc
```

Install the shared types package when you want strongly typed event names, payloads, and return values.

```bash
pnpm add -D @urban-mp/rpc-types
```

```bash
yarn add -D @urban-mp/rpc-types
```

```bash
bun add -d @urban-mp/rpc-types
```

## Quick Start

Create one RPC instance per environment and export it from your own local module.

```ts
import { RPC } from '@urban-mp/rpc'

export const rpc = new RPC({ env: 'client' }).get()
```

Server runtime:

```ts
import { RPC } from '@urban-mp/rpc'

export const rpc = new RPC({ env: 'server' }).get()
```

Webview runtime:

```ts
import { RPC } from '@urban-mp/rpc'

export const rpc = new RPC({ env: 'webview' }).get()
```

Webview with a fixed target resource:

```ts
import { RPC } from '@urban-mp/rpc'

export const rpc = new RPC({
	env: 'webview',
	resourceName: 'target_resource',
}).get()
```

## Runtime Matrix

| From | To | Listen with | Call with |
| --- | --- | --- | --- |
| Server | Server | `onSelf` | `emitSelf` |
| Server | Client | `onServer` on client | `emitClient`, `emitClientEveryone` |
| Server | Webview | `onServer` on webview | `emitWebview` |
| Client | Client | `onSelf` | `emitSelf` |
| Client | Server | `onClient` on server | `emitServer` |
| Client | Webview | `onClient` on webview | `emitWebview` |
| Webview | Webview | `onSelf` | `emitSelf` |
| Webview | Client | `onWebview` on client | `emitClient` |
| Webview | Server | `onWebview` on server | `emitServer` |

Every cross-runtime emit receives `resourceName` before `eventName`. The payload is processed only by the RPC instance running inside that target resource, and the response is routed back to the source resource automatically.

```ts
await rpc.emitServer('server_resource', 'profile:get')
await rpc.emitWebview('ui_resource', 'settings:get', 'volume')
await rpc.emitClient(player, 'client_resource', 'hud:getState')
```

## Configuration

```ts
type RPCConfig<T> = {
	env: T
	debug?: boolean
	resourceName?: string
}
```

| Option | Runtime | Description |
| --- | --- | --- |
| `env` | All | Selects the runtime instance: `server`, `client`, or `webview`. |
| `debug` | All | Enables verbose RPC logs. |
| `resourceName` | All | Overrides the local resource name used as the RPC source. Server/client default to `GetCurrentResourceName()`, webview defaults to `GetParentResourceName()`. |

## Server API

### `onClient`

Listen for client-to-server calls.

```ts
rpc.onClient('inventory:get', async (player, itemId) => {
	return getInventoryItem(player, itemId)
})
```

### `emitClient`

Call one client and wait for the response.

```ts
const state = await rpc.emitClient(player, 'hud_resource', 'hud:getState')
```

### `emitClientEveryone`

Broadcast an event to every client without waiting for a response.

```ts
await rpc.emitClientEveryone('hud_resource', 'hud:notify', 'Server restart in 10 minutes')
```

### `onWebview`

Listen for webview-to-server calls.

```ts
rpc.onWebview('profile:save', async (player, payload) => {
	return saveProfile(player, payload)
})
```

### `emitWebview`

Call a player's webview from the server.

```ts
const accepted = await rpc.emitWebview(player, 'ui_resource', 'modal:confirm', {
	title: 'Confirm purchase',
})
```

### `onSelf` and `emitSelf`

Use local server-only RPC calls.

```ts
rpc.onSelf('cache:flush', async () => true)

const flushed = await rpc.emitSelf('cache:flush')
```

### `onCommand`

Register a FiveM command.

```ts
rpc.onCommand('report', (player, args, commandRaw) => {
	createReport(player, args, commandRaw)
})
```

### `onNativeEvent`

Subscribe to supported native server events.

```ts
rpc.onNativeEvent('playerJoining', (source, oldId) => {
	trackJoin(source, oldId)
})
```

## Client API

### `onServer`

Listen for server-to-client calls.

```ts
rpc.onServer('hud:getState', async () => {
	return getHudState()
})
```

### `emitServer`

Call the server from the client.

```ts
const profile = await rpc.emitServer('server_resource', 'profile:get')
```

### `onWebview`

Listen for webview-to-client calls.

```ts
rpc.onWebview('camera:setMode', async mode => {
	return setCameraMode(mode)
})
```

### `emitWebview`

Call the active webview from the client.

```ts
const value = await rpc.emitWebview('ui_resource', 'settings:get', 'volume')
```

### `onSelf` and `emitSelf`

Use local client-only RPC calls.

```ts
rpc.onSelf('player:getPosition', async () => GetEntityCoords(PlayerPedId(), false))

const position = await rpc.emitSelf('player:getPosition')
```

### `onCommand`

Register a client command.

```ts
rpc.onCommand('toggleui', () => {
	toggleUi()
})
```

### `onNativeEvent`

Subscribe to supported native client events.

```ts
rpc.onNativeEvent('entityDamaged', (victim, culprit, weapon, damage) => {
	trackDamage(victim, culprit, weapon, damage)
})
```

### `onNativeNetworkEvent`

Subscribe to supported network game events.

```ts
rpc.onNativeNetworkEvent('CEventShockingCarCrash', (entities, eventEntity, data) => {
	trackCrash(entities, eventEntity, data)
})
```

### `setWebviewFocus`

Control NUI focus and cursor state.

```ts
rpc.setWebviewFocus(true, true)
```

## Webview API

### `onClient`

Listen for client-to-webview calls.

```ts
rpc.onClient('settings:get', async key => {
	return settings[key]
})
```

### `emitClient`

Call the owning client from the webview.

```ts
const cameraMode = await rpc.emitClient('client_resource', 'camera:getMode')
```

### `onServer`

Listen for server-to-webview calls.

```ts
rpc.onServer('modal:confirm', async payload => {
	return openConfirmModal(payload)
})
```

### `emitServer`

Call the server from the webview.

```ts
const saved = await rpc.emitServer('server_resource', 'profile:save', formData)
```

### `onSelf` and `emitSelf`

Use local webview-only RPC calls.

```ts
rpc.onSelf('theme:get', async () => currentTheme)

const theme = await rpc.emitSelf('theme:get')
```

## Typed Events

Create a shared declaration file that is included by your server, client, and webview TypeScript projects.

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

Reference that declaration from each runtime `tsconfig.json`.

```json
{
	"compilerOptions": {
		"types": ["../shared/rpc"]
	}
}
```

## Errors

| Error | Meaning |
| --- | --- |
| `EVENT_NOT_REGISTERED` | The target listener was not registered. |
| `INVALID_DATA` | The received RPC payload could not be parsed. |
| `NO_PLAYER` | FiveM could not resolve the player for the request. |
| `UNKNOWN_NATIVE` | The native event name is not available in the typed list. |
| `UNKNOWN_ENVIRONMENT` | The RPC environment is not `server`, `client`, or `webview`. |

## Exports

```ts
import { RPC } from '@urban-mp/rpc'
import type { RPCConfig, RPCEnvironment } from '@urban-mp/rpc'
```

`RPCFactory` is still exported as an alias for existing projects, but new code should use `RPC`.

## License

Licensed under the Custom Attribution-NoDerivs Software License.
