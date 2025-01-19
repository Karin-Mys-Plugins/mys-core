import { defineMysApi } from '@/mys'
import { MysType } from '.'

export const enum requestMethod {
	GET = 'GET',
	POST = 'POST'
}

export interface BaseMysResDataType {
	retcode: number
	message: string

	error?: string[]
	isCache?: boolean
}

export interface MysApiInfo<
	R extends BaseMysResDataType & { [key: string]: any } | undefined = undefined,
	D extends { [key: string]: any } = {}
> {
	method: requestMethod
	url: (self: defineMysApi<R, D>, data: D) => URL
	body?: (self: defineMysApi<R, D>, data: D) => any
	headers: (self: defineMysApi<R, D>, data: {
		query: string, body: any, data?: D
	}) => Record<string, string>
}

export interface BaseltuidInfo {
	type: MysType
	ltuid: string
}

export interface UidInfo extends BaseltuidInfo {
	uid?: string
	cookie?: string
	stoken?: string
	deviceId?: string
	owner?: boolean
}