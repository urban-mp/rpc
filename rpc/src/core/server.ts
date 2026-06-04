import { Emitter } from '../utils/emitter'
import { generateUUID, parse, stringify } from '../utils/funcs'
import {
	type RPCConfig,
	type RPCEnvironment,
	RPCErrors,
	RPCEvents,
	type RPCState,
	type RPCStateRaw,
} from '../utils/types'
import { Wrapper } from './wrapper'

declare function onNet(eventName: string, callback: Function): void
declare function emitNet(eventName: string, ...args: unknown[]): void
declare function GetCurrentResourceName(): string

export class RPCInstanceServer extends Wrapper {
	private readonly _emitterClient: Emitter
	private readonly _pendingClient: Emitter
	private readonly _emitterWeb: Emitter
	private readonly _pendingWeb: Emitter

	constructor(props: RPCConfig<'server'>) {
		super(props)
		this.resourceName = props.resourceName ?? GetCurrentResourceName()

		this._emitterClient = new Emitter()
		this._pendingClient = new Emitter()
		this._emitterWeb = new Emitter()
		this._pendingWeb = new Emitter()

		this.console.log('[RPC] Initialized Server')

		onNet(RPCEvents.LISTENER_CLIENT, this._handleClient.bind(this))
		onNet(RPCEvents.LISTENER_WEB, this._handleWeb.bind(this))
	}

	private async _handleClient(payloadRaw: RPCStateRaw) {
		try {
			parse(payloadRaw)
		} catch (e) {
			throw new Error(RPCErrors.INVALID_DATA)
		}
		const payload = parse(payloadRaw)
		if (!this.isTargetResource(payload)) return

		if (this.debug) {
			this.console.log(
				`[RPC]:server:accepted ${payload.type} ${payload.event} from ${payload.calledFrom}`,
			)
		}

		if (payload.calledFrom === 'client') {
			if (payload.type === 'event') {
				this.verifyEvent(this._emitterClient, payload)
				if (payload.player === null || payload.player === -1) {
					payload.error = RPCErrors.NO_PLAYER
					this.triggerError(payload)
					return
				}

				const responseData = await this._emitterClient.emit(
					payload.event,
					payload.player,
					...(payload.data && payload.data.length > 0 ? payload.data : []),
				)

				const response: RPCState = {
					event: payload.event,
					uuid: payload.uuid,
					calledFrom: 'server',
					calledTo: 'client',
					sourceResource: this.resourceName,
					targetResource: payload.sourceResource,
					error: null,
					data: [responseData],
					player: payload.player,
					type: 'response',
				}

				emitNet(RPCEvents.LISTENER_SERVER, response.player, stringify(response))
			}
			if (payload.type === 'response') {
				await this._pendingClient.emit(
					payload.uuid,
					...(payload.data && payload.data.length > 0 ? payload.data : []),
				)
			}
		}
	}

	private async _handleWeb(payloadRaw: RPCStateRaw) {
		try {
			parse(payloadRaw)
		} catch (e) {
			throw new Error(RPCErrors.INVALID_DATA)
		}
		const payload = parse(payloadRaw)
		if (!this.isTargetResource(payload)) return

		if (this.debug) {
			this.console.log(
				`[RPC]:server:accepted ${payload.type} ${payload.event} from ${payload.calledFrom}`,
			)
		}

		if (payload.calledFrom === 'cef') {
			if (payload.type === 'event') {
				this.verifyEvent(this._emitterWeb, payload)
				if (payload.player === null || payload.player === -1) {
					payload.error = RPCErrors.NO_PLAYER
					this.triggerError(payload)
					return
				}

				const responseData = await this._emitterWeb.emit(
					payload.event,
					payload.player,
					...(payload.data && payload.data.length > 0 ? payload.data : []),
				)

				const response: RPCState = {
					event: payload.event,
					uuid: payload.uuid,
					calledFrom: 'server',
					calledTo: 'cef',
					sourceResource: this.resourceName,
					targetResource: payload.sourceResource,
					error: null,
					data: [responseData],
					player: payload.player,
					type: 'response',
				}

				emitNet(RPCEvents.LISTENER_SERVER, response.player, stringify(response))
			}
			if (payload.type === 'response') {
				await this._pendingWeb.emit(
					payload.uuid,
					...(payload.data && payload.data.length > 0 ? payload.data : []),
				)
			}
		}
	}

	public register(
		eventName: string,
		cb: (player: number, ...args: unknown[]) => unknown | Promise<unknown>,
	): this {
		if (this.debug) {
			this.console.log(`[RPC]:register ${eventName}`)
		}

		this._emitterClient.on(eventName, cb)
		this._emitterWeb.on(eventName, cb)
		this._emitterLocal.on(eventName, (...args: unknown[]) => cb(-1, ...args))

		return this
	}

	public call(
		env: 'server',
		eventName: string,
		...args: unknown[]
	): Promise<unknown>
	public call(
		env: 'client' | 'cef',
		eventName: string,
		player: number,
		...args: unknown[]
	): Promise<unknown>
	public call(
		env: RPCEnvironment,
		eventName: string,
		playerOrArg?: number | unknown,
		...args: unknown[]
	): Promise<unknown> {
		if (env === 'server') {
			const selfArgs = playerOrArg === undefined ? args : [playerOrArg, ...args]

			return this._callSelf(eventName, ...selfArgs)
		}

		const player = playerOrArg as number
		const resourceName = this.resourceName ?? ''

		if (env === 'client') {
			return this._callClient(player, resourceName, eventName, ...args)
		}

		return this._callCef(player, resourceName, eventName, ...args)
	}

	private async _callClient(
		player: number,
		resourceName: string,
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const payload: RPCState = {
			event: eventName,
			uuid: generateUUID(),
			calledFrom: 'server',
			calledTo: 'client',
			sourceResource: this.resourceName,
			targetResource: resourceName,
			error: null,
			data: args.length ? args : null,
			player: player,
			type: 'event',
		}

		const responsePromise = new Promise<unknown>(res => {
			this._pendingClient.once(payload.uuid, res)
		})

		emitNet(RPCEvents.LISTENER_SERVER, player, stringify(payload))

		return responsePromise
	}

	public async callClientEveryone(
		resourceName: string,
		eventName: string,
		...args: unknown[]
	): Promise<void> {
		const payload: RPCState = {
			event: eventName,
			uuid: generateUUID(),
			calledFrom: 'server',
			calledTo: 'client',
			sourceResource: this.resourceName,
			targetResource: resourceName,
			error: null,
			data: args.length ? args : null,
			player: -1,
			type: 'event',
		}

		emitNet(RPCEvents.LISTENER_SERVER, -1, stringify(payload))
	}

	private async _callCef(
		player: number,
		resourceName: string,
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const payload: RPCState = {
			event: eventName,
			uuid: generateUUID(),
			calledFrom: 'server',
			calledTo: 'cef',
			sourceResource: this.resourceName,
			targetResource: resourceName,
			error: null,
			data: args.length ? args : null,
			player: player,
			type: 'event',
		}

		const responsePromise = new Promise<unknown>(res => {
			this._pendingWeb.once(payload.uuid, res)
		})

		emitNet(RPCEvents.LISTENER_SERVER, player, stringify(payload))

		return responsePromise
	}

	private async _callSelf(
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const payload: RPCState = {
			event: eventName,
			uuid: generateUUID(),
			calledFrom: 'server',
			calledTo: 'server',
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
}
