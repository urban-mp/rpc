# @urban-mp/rpc-types

This package is no longer required by the current `@urban-mp/rpc` API.

The runtime now uses a simple dynamic API:

```ts
rpc.register('event:name', async (...args) => {
	return result
})

await rpc.call('server', 'event:name', ...args)
```

Use `@urban-mp/rpc` directly for new code.
