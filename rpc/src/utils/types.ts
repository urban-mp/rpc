import type { RPCInstanceClient } from '../core/client'
import type { RPCInstanceServer } from '../core/server'
import type { RPCInstanceWebview } from '../core/webview'

export type RPCEnvironment = 'server' | 'client' | 'cef'

export type RPCEnvironmentResolved<T extends RPCEnvironment> =
	T extends 'server'
		? RPCInstanceServer
		: T extends 'client'
			? RPCInstanceClient
			: T extends 'cef'
				? RPCInstanceWebview
				: never

export type RPCConfig<T extends RPCEnvironment | unknown> = {
	env: T
	debug?: boolean
	resourceName?: string
}

export type RPCEventType = 'event' | 'response'

export type RPCState = {
	event: string
	uuid: string
	calledFrom: RPCEnvironment
	calledTo: RPCEnvironment
	sourceResource: string | null
	targetResource: string | null
	error: string | null
	data: unknown[] | null
	player: number | null
	type: RPCEventType
}

export type RPCStateRaw = string & { __brand: 'RPCStateRaw' }

export type RPCStateWeb = {
	origin: RPCEvents
	data: RPCState
}

export type RPCStateWebRaw = string & { __brand: 'RPCWebStateRaw' }

export enum RPCEvents {
	LISTENER_SERVER = '__rpc:listenerServer',
	LISTENER_CLIENT = '__rpc:listenerClient',
	LISTENER_WEB = '__rpc:listenerWeb',
}

export enum RPCErrors {
	EVENT_NOT_REGISTERED = 'Event not registered',
	INVALID_DATA = 'Invalid data (possibly broken JSON)',
	NO_PLAYER = 'No player (failed to resolve from local index)',
	UNKNOWN_ENVIRONMENT = 'Unknown environment (must be either "server", "client" or "cef")',
}
