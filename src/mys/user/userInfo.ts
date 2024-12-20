import { common } from '@/utils'
import { userInfoData, mysUserInfoData } from '../db'
import { CoreRefreshUidHandlerData, MysType, MysUserInfoDataType, UserInfoDataType, UserInfoLtuidMapType, requestMethod } from '@/types'
import { getCookieTokenBySToken, getUserGameRolesByCookie } from '..'
import { handler } from 'node-karin'

export class UserInfo {
	user_id: UserInfoDataType['user_id']
	#ltuids: UserInfoDataType['ltuids'] = []
	#stuids: UserInfoDataType['stuids'] = []

	#ltuidMap = new Map<string, UserInfoLtuidMapType>()

	constructor (user_id: string) {
		this.user_id = user_id
	}

	get ltuids () {
		return Object.freeze(this.#ltuids)
	}

	get stuids () {
		return Object.freeze(this.#stuids)
	}

	static async create (user_id: string) {
		const userInfo = new UserInfo(user_id)

		const UserInfoData = await userInfoData.findByPk(user_id, true)
		await userInfo.#initMysUserInfoData(UserInfoData.ltuids, UserInfoData.stuids)

		return userInfo
	}

	async #initMysUserInfoData (ltuids: string[], stuids: string[]) {
		this.#ltuidMap.clear()
		this.#ltuids = ltuids
		this.#stuids = stuids

		const id_list = Array.from(new Set([...ltuids, ...stuids]))

		const MysUserInfoDataList = await mysUserInfoData.findAllByPks(id_list)
		MysUserInfoDataList.forEach((MysUserInfoData) => {
			const item: UserInfoLtuidMapType = { ...MysUserInfoData, perm: 0 }
			if (ltuids.some(ltuid => ltuid === item.ltuid)) {
				item.perm += 1
			}
			if (stuids.some(stuid => stuid === item.ltuid)) {
				item.perm += 2
			}
			this.#ltuidMap.set(item.ltuid, item)
		})
	}

	getLtuidInfo (ltuid: string) {
		return Object.freeze(this.#ltuidMap.get(ltuid))
	}

	async setUserInfoData (data: Partial<UserInfoDataType>) {
		await userInfoData.update(this.user_id, {
			...await userInfoData.findByPk(this.user_id, true),
			...data
		})
	}

	async setMysUserInfoData (ltuid: string, data: Partial<MysUserInfoDataType>) {
		await mysUserInfoData.update(ltuid, {
			...await mysUserInfoData.findByPk(ltuid, true),
			...data
		})
	}

	async refresh () {
		const UserInfoData = await userInfoData.findByPk(this.user_id, true)
		await this.#initMysUserInfoData(UserInfoData.ltuids, UserInfoData.stuids)
	}
}

export const updataCookie = async (
	stokenParams: {
		ltuid: string,
		stoken: string,
		mid: string,
		ltoken: string
	},
	serv: MysType
): Promise<{
	cookie: string
	message: string
}> => {
	const res = await getCookieTokenBySToken(
		serv === MysType.cn ? requestMethod.GET : requestMethod.POST
	).request({
		stoken: new URLSearchParams({
			stoken: stokenParams.stoken,
			mid: stokenParams.mid,
			ltoken: stokenParams.ltoken,
			uid: stokenParams.ltuid
		}).toString()
	})

	let cookie = ''
	let message = ''
	if (res?.retcode === -100) {
		message = "登录状态失效，请重新#扫码登录！"
	} else if (res?.data?.cookie_token) {
		cookie = common.objToStr({
			ltuid: stokenParams.ltuid,
			ltoken: stokenParams.ltoken,
			cookie_token: res.data.cookie_token,
			account_id: stokenParams.ltuid
		}, ';')

	} else {
		message = "获取Cookie失败，请重新#扫码登录！"
	}

	return {
		cookie, message
	}
}

export const refreshUid = async (options: {
	type: MysType
	ltuid: string
	cookie: string
}): Promise<{
	uids: CoreRefreshUidHandlerData,
	message: string
}> => {
	const res = await getUserGameRolesByCookie(options).request()

	let message = ''
	const uidList = { data: {}, names: {} }
	if (res?.retcode === 0) {
		await handler.call('mys_core.refresh.uid', uidList)
	} else if (res?.retcode === -100) {
		message = "Cookie已失效，请重新#扫码登录或#刷新Cookie！"
	} else {
		message = res?.message || "刷新UID失败，请稍后再试！"
	}

	return {
		uids: uidList, message
	}
}