import { Emitter } from '../utils/emitter'
import { generateUUID, parse, stringify, stringifyWeb } from '../utils/funcs'
import {
	type RPCConfig,
	type RPCEnvironment,
	RPCErrors,
	RPCEvents,
	type RPCState,
	type RPCStateRaw,
	type RPCStateWeb,
} from '../utils/types'
import { Wrapper } from './wrapper'

declare function onNet(eventName: string, callback: Function): void
declare function emitNet(eventName: string, ...args: unknown[]): void
declare function on(eventName: string, callback: Function): void
declare function RegisterNuiCallbackType(callbackType: string): void
declare function GetPlayerServerId(player: number): number
declare function PlayerId(): number
declare function GetCurrentResourceName(): string
declare function SendNuiMessage(jsonString: string): boolean

export class RPCInstanceClient extends Wrapper {
	private readonly _emitterServer: Emitter
	private readonly _pendingServer: Emitter
	private readonly _emitterWeb: Emitter
	private readonly _pendingWeb: Emitter
	private readonly _pendingWebToServer: Emitter

	constructor(props: RPCConfig<'client'>) {
		super(props)
		this.resourceName = props.resourceName ?? GetCurrentResourceName()

		this._emitterServer = new Emitter()
		this._pendingServer = new Emitter()
		this._emitterWeb = new Emitter()
		this._pendingWeb = new Emitter()
		this._pendingWebToServer = new Emitter()

		this.console.log('[RPC] Initialized Client')

		onNet(RPCEvents.LISTENER_SERVER, this._handleServer.bind(this))
		RegisterNuiCallbackType(RPCEvents.LISTENER_WEB)
		on(
			`__cfx_nui:${RPCEvents.LISTENER_WEB}`,
			async (data: RPCState, callback: (res: unknown) => void) => {
				const res = await this._handleWeb(data)
				callback(res)
			},
		)
	}

	private async _handleServer(payloadRaw: RPCStateRaw) {
		try {
			parse(payloadRaw)
		} catch (e) {
			throw new Error(RPCErrors.INVALID_DATA)
		}
		const payload = parse(payloadRaw)
		if (!this.isTargetResource(payload)) return

		if (this.debug) {
			this.console.log(
				`[RPC]:client:accepted ${payload.type} ${payload.event} from ${payload.calledFrom}`,
			)
		}

		if (payload.type === 'event') {
			if (payload.calledTo === 'client') {
				this.verifyEvent(this._emitterServer, payload)

				const responseData = await this._emitterServer.emit(
					payload.event,
					...(payload.data && payload.data.length > 0 ? payload.data : []),
				)

				const response: RPCState = {
					event: payload.event,
					uuid: payload.uuid,
					calledFrom: 'client',
					calledTo: 'server',
					sourceResource: this.resourceName,
					targetResource: payload.sourceResource,
					error: null,
					data: [responseData],
					player: payload.player,
					type: 'response',
				}

				emitNet(RPCEvents.LISTENER_CLIENT, stringify(response))
			}
			if (payload.calledTo === 'cef') {
				this._sendWebMessage({
					origin: RPCEvents.LISTENER_SERVER,
					data: payload,
				})
			}
		}
		if (payload.type === 'response') {
			if (payload.calledTo === 'client') {
				await this._pendingServer.emit(
					payload.uuid,
					...(payload.data && payload.data.length > 0 ? payload.data : []),
				)
			}
			if (payload.calledTo === 'cef') {
				await this._pendingWebToServer.emit(
					payload.uuid,
					...(payload.data && payload.data.length > 0 ? payload.data : []),
				)
			}
		}
	}

	private async _handleWeb(payload: RPCState): Promise<unknown> {
		if (this.debug) {
			this.console.log(
				`[RPC]:client:accepted ${payload.type} ${payload.event} from ${payload.calledFrom}`,
			)
		}

		if (payload.type === 'event') {
			if (payload.calledTo === 'client') {
				if (!this.isTargetResource(payload)) return { status: 'ignored' }

				return await this._emitterWeb.emit(
					payload.event,
					...(payload.data && payload.data.length > 0 ? payload.data : []),
				)
			}
			if (payload.calledTo === 'server') {
				payload.player = GetPlayerServerId(PlayerId())
				const responsePromise = new Promise(res => {
					this._pendingWebToServer.once(payload.uuid, res)
				})

				emitNet(RPCEvents.LISTENER_WEB, stringify(payload))

				return responsePromise
			}
		}

		if (payload.type === 'response') {
			if (payload.calledTo === 'client') {
				if (!this.isTargetResource(payload)) return { status: 'ignored' }

				await this._pendingWeb.emit(
					payload.uuid,
					...(payload.data && payload.data.length > 0 ? payload.data : []),
				)

				return { status: 'ok' }
			}
			if (payload.calledTo === 'server') {
				payload.player = GetPlayerServerId(PlayerId())
				emitNet(RPCEvents.LISTENER_WEB, stringify(payload))

				return { status: 'ok' }
			}
		}
		return { status: 'unknown' }
	}

	public register(
		eventName: string,
		cb: (...args: unknown[]) => unknown | Promise<unknown>,
	): this {
		if (this.debug) {
			this.console.log(`[RPC]:register ${eventName}`)
		}

		this._emitterServer.on(eventName, cb)
		this._emitterWeb.on(eventName, cb)
		this._emitterLocal.on(eventName, cb)

		return this
	}

	public call(
		env: RPCEnvironment,
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const resourceName = this.resourceName ?? ''

		if (env === 'server') {
			return this._callServer(resourceName, eventName, ...args)
		}

		if (env === 'cef') {
			return this._callCef(resourceName, eventName, ...args)
		}

		return this._callSelf(eventName, ...args)
	}

	private async _callServer(
		resourceName: string,
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const payload: RPCState = {
			event: eventName,
			uuid: generateUUID(),
			calledFrom: 'client',
			calledTo: 'server',
			sourceResource: this.resourceName,
			targetResource: resourceName,
			error: null,
			data: args.length ? args : null,
			player: GetPlayerServerId(PlayerId()),
			type: 'event',
		}

		const responsePromise = new Promise<unknown>(res => {
			this._pendingServer.once(payload.uuid, res)
		})

		emitNet(RPCEvents.LISTENER_CLIENT, stringify(payload))

		return responsePromise
	}

	private async _callCef(
		resourceName: string,
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const payload: RPCState = {
			event: eventName,
			uuid: generateUUID(),
			calledFrom: 'client',
			calledTo: 'cef',
			sourceResource: this.resourceName,
			targetResource: resourceName,
			error: null,
			data: args.length ? args : null,
			player: PlayerId(),
			type: 'event',
		}

		const responsePromise = new Promise<unknown>(res => {
			this._pendingWeb.once(payload.uuid, res)
		})

		this._sendWebMessage({
			origin: RPCEvents.LISTENER_CLIENT,
			data: payload,
		})

		return responsePromise
	}

	private async _callSelf(
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const payload: RPCState = {
			event: eventName,
			uuid: generateUUID(),
			calledFrom: 'client',
			calledTo: 'client',
			sourceResource: this.resourceName,
			targetResource: this.resourceName,
			error: null,
			data: args.length ? args : null,
			player: null,
			type: 'event',
		}

		if (this.debug) {
			this.console.log(
				`[RPC]:accepted ${payload.event} from ${payload.calledFrom}`,
			)
		}

		this.verifyEvent(this._emitterLocal, payload)

		return await this._emitterLocal.emit(
			payload.event,
			...(payload.data && payload.data.length > 0 ? payload.data : []),
		)
	}

	private _sendWebMessage(payload: RPCStateWeb): void {
		SendNuiMessage(stringifyWeb(payload))
	}
}
