import { defineMysApi, MysApp } from '.'

export const NoHeaders = (self: defineMysApi<any, any>, data: any) => ({})

export const BaseHeaders = (self: defineMysApi<any, any>) => ({
	'x-rpc-app_version': MysApp.version.cn,
	'x-rpc-client_type': '5',
	'x-rpc-device_id': self.uidInfo.deviceId!,
	'User-Agent': `Mozilla/5.0 (Linux; Android 12; ${self.deviceName}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBS/${MysApp.version.cn}`,
	Referer: 'https://webstatic.mihoyo.com'
})

export const BaseOsHeaders = {
	'x-rpc-app_version': MysApp.version.cn,
	'x-rpc-client_type': '4',
	'x-rpc-language': 'zh-cn'
}

export const PassportHeaders = (self: defineMysApi<any, any>, options: { query?: string, body?: any } = {}) => {
	const { query = '', body = '' } = options
	return {
		'x-rpc-app_version': MysApp.version.cn,
		'x-rpc-game_biz': 'bbs_cn',
		'x-rpc-client_type': '2',
		'User-Agent': 'okhttp/4.8.0',
		'x-rpc-app_id': 'bll8iq97cem8',
		DS: self.getDS1(query, JSON.stringify(body), 'PROD')
	}
}

export const CookieHeaders = (self: defineMysApi<any, any>, options: { query?: string, body?: any } = {}) => ({
	Cookie: self.uidInfo.cookie!,
	...(self.isHoyolab ? BaseOsHeaders : BaseHeaders(self))
})