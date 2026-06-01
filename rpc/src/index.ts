import { RPCInstanceClient } from './core/client'
import { RPCInstanceServer } from './core/server'
import { RPCInstanceWebview } from './core/webview'
import { Wrapper } from './core/wrapper'
import {
	type RPCConfig,
	type RPCEnvironment,
	type RPCEnvironmentResolved,
	RPCErrors,
} from './utils/types'

class RPC<T extends RPCEnvironment> extends Wrapper {
	private readonly operator:
		| RPCInstanceServer
		| RPCInstanceClient
		| RPCInstanceWebview

	constructor(opts: RPCConfig<T>) {
		super(opts)

		this.console.log('[RPC] Initializing...')

		switch (opts.env) {
			case 'server':
				this.operator = new RPCInstanceServer(opts as RPCConfig<'server'>)
				break
			case 'client':
				this.operator = new RPCInstanceClient(opts as RPCConfig<'client'>)
				break
			case 'webview':
				this.operator = new RPCInstanceWebview(opts as RPCConfig<'webview'>)
				break
			default:
				throw new Error(RPCErrors.UNKNOWN_ENVIRONMENT)
		}
	}

	public get(): RPCEnvironmentResolved<T> {
		return this.operator as RPCEnvironmentResolved<T>
	}
}

const RPCFactory = RPC

export { RPC, RPCFactory }
export * from './utils/types'
export * from './utils/native'
export type * from './core/server'
export type * from './core/client'
export type * from './core/webview'
