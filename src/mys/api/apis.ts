import { BaseltuidInfo, BaseMysResDataType, requestMethod, UidInfo } from '@/types'
import { defineMysApi, MysHosts, MysApp, NoHeaders, PassportHeaders, CookieHeaders } from '.'

export const fetchQRcode = () => new defineMysApi<
	BaseMysResDataType & {
		data: {
			url: string
		}
	},
	{ device: string }
>({
	method: requestMethod.POST,
	url: (self, data) => new URL(`${MysHosts.hk4e_sdk_api}hk4e_cn/combo/panda/qrcode/fetch`),
	body: (self, data) => ({
		app_id: MysApp.app_id,
		device: data!.device
	}),
	headers: NoHeaders
})

export const queryQRcode = () => new defineMysApi<
	BaseMysResDataType & {
		data: {
			stat: 'Scanned' | 'Confirmed',
			payload: {
				raw: string
			}
		}
	},
	{ device: string, ticket: string }
>({
	method: requestMethod.POST,
	url: (self, data) => new URL(`${MysHosts.hk4e_sdk_api}hk4e_cn/combo/panda/qrcode/query`),
	body: (self, data) => ({
		app_id: MysApp.app_id,
		device: data!.device,
		ticket: data!.ticket
	}),
	headers: NoHeaders
})

export const getTokenByGameToken = () => new defineMysApi<
	BaseMysResDataType & {
		data: {
			token: {
				token: string
			},
			user_info: {
				aid: string
				mid: string
			}
		}
	},
	{ account_id: number, game_token: string }
>({
	method: requestMethod.POST,
	url: (self, data) => new URL(`${MysHosts.pass_api}account/ma-cn-session/app/getTokenByGameToken`),
	body: (self, data) => ({
		account_id: data!.account_id,
		game_token: data!.game_token
	}),
	headers: PassportHeaders
})

export const getCookieTokenBySToken = (method: requestMethod) => new defineMysApi<
	BaseMysResDataType & {
		data: {
			cookie_token: string
		}
	},
	{ stoken: string }
>({
	method,
	url: (self, data) => {
		let host = MysHosts.web_api
		let game_biz = 'hk4e_cn'
		if (self.isHoyolab) {
			host = MysHosts.os_web_api
			game_biz = 'hk4e_global'
		}
		return new URL(`${host}auth/api/getCookieAccountInfoBySToken?game_biz=${game_biz}&${data!.stoken}`)
	},
	headers: NoHeaders
})

interface UserGameRole {
	game_biz: string
	region: string
	game_uid: string
	nickname: string
	is_chosen: boolean
}

export const getUserGameRolesByCookie = (uidInfo: {
	cookie: string
} & BaseltuidInfo) => new defineMysApi<
	BaseMysResDataType & {
		data: {
			list: UserGameRole[]
		}
	}
>({
	method: requestMethod.GET,
	url: (self, data) => new URL(`${MysHosts[self.isHoyolab ? 'os_web_api' : 'web_api']}binding/api/getUserGameRolesByCookie`),
	headers: CookieHeaders
}, uidInfo)

export const getUserFullInfo = (uidInfo: {
	cookie: string
} & BaseltuidInfo) => new defineMysApi<
	BaseMysResDataType & {
		data: {
			user_info: {
				uid: string
			}
		}
	}
>({
	method: requestMethod.GET,
	url: (self, data) => new URL(`${MysHosts.new_web_api}user/wapi/getUserFullInfo?gids=2`),
	headers: CookieHeaders
}, uidInfo)