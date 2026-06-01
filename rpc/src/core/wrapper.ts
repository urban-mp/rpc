import { Emitter } from '../utils/emitter'
import { parse } from '../utils/funcs'
import {
	type RPCConfig,
	type RPCEnvironment,
	RPCErrors,
	type RPCState,
	type RPCStateRaw,
} from '../utils/types'

export class Wrapper {
	protected env: RPCEnvironment
	protected _emitterLocal: Emitter
	protected debug: boolean
	protected console: Console
	protected resourceName: string | null

	constructor(cfg: RPCConfig<RPCEnvironment>) {
		this.env = cfg.env
		this._emitterLocal = new Emitter()
		this.debug = cfg.debug ?? false
		this.console = console
		this.resourceName = cfg.resourceName ?? null
	}

	protected isTargetResource(rpcData: RPCState): boolean {
		return !rpcData.targetResource || rpcData.targetResource === this.resourceName
	}

	protected verifyEvent(state: Emitter, data: RPCStateRaw | RPCState) {
		const rpcData = typeof data === 'string' ? parse(data) : data

		if (!state.has(rpcData.event)) {
			rpcData.error = RPCErrors.EVENT_NOT_REGISTERED
			this.triggerError(rpcData)
		}
	}

	protected triggerError(rpcData: RPCState, error?: string): Error {
		const errorMessage = [
			`${rpcData.error}`,
			`Event: ${rpcData.event}`,
			`Uuid: ${rpcData.uuid}`,
			`From: ${rpcData.calledFrom}`,
			`To: ${rpcData.calledTo}`,
			`Source resource: ${rpcData.sourceResource}`,
			`Target resource: ${rpcData.targetResource}`,
			`Player: ${rpcData.player}`,
			`Type: ${rpcData.type}`,
			`Data: ${rpcData.data}`,
		]

		if (error) {
			errorMessage.push(`Info: ${error}`)
		}

		throw new Error(errorMessage.join('\n | '))
	}
}
