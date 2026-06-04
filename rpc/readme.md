# FiveM RPC

Small Promise-based RPC for FiveM `server`, `client`, and `cef` runtimes.

## Installation

```bash
npm install @urban-mp/rpc
```

## Create An Instance

Create one instance per runtime.

```ts
import { RPC } from '@urban-mp/rpc'

export const rpc = new RPC({ env: 'server' }).get()
```

```ts
export const rpc = new RPC({ env: 'client' }).get()
```

```ts
export const rpc = new RPC({ env: 'cef' }).get()
```

`resourceName` is optional. Server/client default to `GetCurrentResourceName()`, and CEF defaults to `GetParentResourceName()`.

```ts
export const rpc = new RPC({
	env: 'cef',
	resourceName: 'my_resource',
}).get()
```

## Register Events

Use `register` everywhere.

```ts
rpc.register('profile:get', async userId => {
	return getProfile(userId)
})
```

On server, handlers receive `player` as the first argument when the call comes from `client` or `cef`.

```ts
rpc.register('inventory:get', async (player, itemId) => {
	return getInventoryItem(player, itemId)
})
```

## Call Events

Use `call(targetEnv, eventName, ...args)` everywhere.

```ts
const profile = await rpc.call('server', 'profile:get', userId)
```

Server calls to a player runtime use `eventName` before `player`.

```ts
await rpc.call('client', 'hud:setVisible', player, true)
await rpc.call('cef', 'modal:open', player, { id: 'inventory' })
```

## Call Matrix

| From | To | Example |
| --- | --- | --- |
| Server | Server | `rpc.call('server', 'cache:flush')` |
| Server | Client | `rpc.call('client', 'hud:getState', player)` |
| Server | CEF | `rpc.call('cef', 'modal:open', player, payload)` |
| Client | Server | `rpc.call('server', 'profile:get', userId)` |
| Client | Client | `rpc.call('client', 'player:getPosition')` |
| Client | CEF | `rpc.call('cef', 'settings:get', key)` |
| CEF | Server | `rpc.call('server', 'profile:save', payload)` |
| CEF | Client | `rpc.call('client', 'camera:getMode')` |
| CEF | CEF | `rpc.call('cef', 'theme:get')` |

## Broadcast From Server

Server can call all clients with `callClientEveryone`.

```ts
await rpc.callClientEveryone('my_resource', 'hud:announce', 'Hello')
```

## Configuration

```ts
type RPCConfig = {
	env: 'server' | 'client' | 'cef'
	debug?: boolean
	resourceName?: string
}
```

## Errors

| Error | Meaning |
| --- | --- |
| `EVENT_NOT_REGISTERED` | The target runtime has no handler for that event. |
| `INVALID_DATA` | The received payload could not be parsed. |
| `NO_PLAYER` | FiveM could not resolve the player. |
| `UNKNOWN_ENVIRONMENT` | The env is not `server`, `client`, or `cef`. |

## Exports

```ts
import { RPC, RPCFactory } from '@urban-mp/rpc'
```
