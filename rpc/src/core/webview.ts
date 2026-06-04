import { Emitter } from '../utils/emitter'
import { generateUUID, stringify } from '../utils/funcs'
import {
	RPCEvents,
	type RPCConfig,
	type RPCEnvironment,
	type RPCState,
	type RPCStateRaw,
	type RPCStateWeb,
} from '../utils/types'
import { Wrapper } from './wrapper'

declare global {
	interface Window {
		GetParentResourceName?: () => string
	}
}

export class RPCInstanceWebview extends Wrapper {
	private readonly _emitterClient: Emitter
	private readonly _emitterServer: Emitter

	constructor(props: RPCConfig<'cef'>) {
		super(props)
		this.resourceName =
			props.resourceName ?? window?.GetParentResourceName?.() ?? 'nui-frame-app'

		this._emitterClient = new Emitter()
		this._emitterServer = new Emitter()

		this.console.log('[RPC] Initialized CEF')

		window.addEventListener('message', (e: MessageEvent<RPCStateWeb>) => {
			if (e.data.origin === RPCEvents.LISTENER_CLIENT) {
				this._handleClient(e.data.data)
			}
			if (e.data.origin === RPCEvents.LISTENER_SERVER) {
				this._handleServer(e.data.data)
			}
		})
	}

	private async _handleClient(payload: RPCState) {
		if (!this.isTargetResource(payload)) return

		if (this.debug) {
			this.console.log(
				`[RPC]:cef:accepted ${payload.type} ${payload.event} from ${payload.calledFrom}`,
			)
		}

		if (payload.calledFrom === 'client' && payload.type === 'event') {
			this.verifyEvent(this._emitterClient, payload)

			const responseData = await this._emitterClient.emit(
				payload.event,
				...(payload.data && payload.data.length > 0 ? payload.data : []),
			)

			const response: RPCState = {
				event: payload.event,
				uuid: payload.uuid,
				calledFrom: 'cef',
				calledTo: 'client',
				sourceResource: this.resourceName,
				targetResource: payload.sourceResource,
				error: null,
				data: [responseData],
				player: payload.player,
				type: 'response',
			}

			await this._createHttpClientRequest(response).then()
		}
	}

	private async _handleServer(payload: RPCState) {
		if (!this.isTargetResource(payload)) return

		if (this.debug) {
			this.console.log(
				`[RPC]:cef:accepted ${payload.type} ${payload.event} from ${payload.calledFrom}`,
			)
		}

		if (payload.calledFrom === 'server' && payload.type === 'event') {
			this.verifyEvent(this._emitterServer, payload)

			const responseData = await this._emitterServer.emit(
				payload.event,
				...(payload.data && payload.data.length > 0 ? payload.data : []),
			)

			const response: RPCState = {
				event: payload.event,
				uuid: payload.uuid,
				calledFrom: 'cef',
				calledTo: 'server',
				sourceResource: this.resourceName,
				targetResource: payload.sourceResource,
				error: null,
				data: [responseData],
				player: payload.player,
				type: 'response',
			}

			await this._createHttpClientRequest(response)
		}
	}

	public register(
		eventName: string,
		cb: (...args: unknown[]) => unknown | Promise<unknown>,
	): this {
		if (this.debug) {
			this.console.log(`[RPC]:register ${eventName}`)
		}

		this._emitterClient.on(eventName, cb)
		this._emitterServer.on(eventName, cb)
		this._emitterLocal.on(eventName, cb)

		return this
	}

	public call(
		env: RPCEnvironment,
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const resourceName = this.resourceName ?? ''

		if (env === 'client') {
			return this._callClient(resourceName, eventName, ...args)
		}

		if (env === 'server') {
			return this._callServer(resourceName, eventName, ...args)
		}

		return this._callSelf(eventName, ...args)
	}

	private async _callClient(
		resourceName: string,
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const payload: RPCState = {
			event: eventName,
			uuid: generateUUID(),
			calledFrom: 'cef',
			calledTo: 'client',
			sourceResource: resourceName,
			targetResource: resourceName,
			error: null,
			data: args.length ? args : null,
			player: null,
			type: 'event',
		}

		return await this._createHttpClientRequest(payload, resourceName)
	}

	private async _callServer(
		resourceName: string,
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const payload: RPCState = {
			event: eventName,
			uuid: generateUUID(),
			calledFrom: 'cef',
			calledTo: 'server',
			sourceResource: resourceName,
			targetResource: resourceName,
			error: null,
			data: args.length ? args : null,
			player: null,
			type: 'event',
		}

		return await this._createHttpClientRequest(payload, resourceName)
	}

	private async _callSelf(
		eventName: string,
		...args: unknown[]
	): Promise<unknown> {
		const payload: RPCState = {
			event: eventName,
			uuid: generateUUID(),
			calledFrom: 'cef',
			calledTo: 'cef',
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

	private async _createHttpClientRequest<R>(
		data: RPCStateRaw | RPCState,
		resourceName?: string,
	): Promise<R> {
		const dataRaw = typeof data === 'string' ? data : stringify(data)
		const options = {
			method: 'post',
			headers: {
				'Content-Type': 'application/json; charset=UTF-8',
			},
			body: dataRaw,
		}
		const targetResourceName =
			resourceName ??
			this.resourceName ??
			window?.GetParentResourceName?.() ??
			'nui-frame-app'
		return fetch(
			`https://${targetResourceName}/${RPCEvents.LISTENER_WEB}`,
			options,
		).then(res => res.json())
	}
}
