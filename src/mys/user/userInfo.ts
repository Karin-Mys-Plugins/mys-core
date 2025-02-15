import { CoreRefreshUidData, MysCoreReturnType, MysType, MysUserInfoDataType, baseUserInfoDataType, requestMethod } from '@/types'
import { common } from '@/utils'
import { getCookieTokenBySToken, getUserGameRolesByCookie } from '../api'
import { mysUserInfoData, userInfoData } from '../db'

export class baseUserInfo {
	user_id: baseUserInfoDataType['user_id']
	#ltuids: baseUserInfoDataType['ltuids'] = []
	#stuids: baseUserInfoDataType['stuids'] = []

	declare UserInfo: MysCoreReturnType<baseUserInfoDataType>
	#ltuidMap = new Map<string, MysCoreReturnType<MysUserInfoDataType>>()

	constructor (user_id: string) {
		this.user_id = user_id
	}

	get ltuids () {
		return Object.freeze(this.#ltuids)
	}

	get stuids () {
		return Object.freeze(this.#stuids)
	}

	async initMysUserInfoData (UserInfoData: MysCoreReturnType<baseUserInfoDataType>) {
		this.UserInfo = UserInfoData
		const { ltuids, stuids } = UserInfoData

		this.#ltuidMap.clear()
		this.#ltuids = ltuids
		this.#stuids = stuids

		const id_list = Array.from(new Set([...ltuids, ...stuids]))

		const MysUserInfoDataList = await mysUserInfoData.findAllByPks(id_list)
		MysUserInfoDataList.forEach((MysUserInfoData) => {
			this.#ltuidMap.set(MysUserInfoData.ltuid, MysUserInfoData)
		})

		return this
	}

	getLtuidInfo (ltuid: string) {
		return Object.freeze(this.#ltuidMap.get(ltuid))
	}

	async setUserInfoData (data: any) {
		await this.UserInfo._save(data)
	}

	async setMysUserInfoData (ltuid: string, data: any) {
		let MysUserInfo = this.#ltuidMap.get(ltuid)
		if (!MysUserInfo) {
			MysUserInfo = await mysUserInfoData.findByPk(ltuid, true)
		}

		await MysUserInfo._save(data)
		this.#ltuidMap.set(ltuid, { ...MysUserInfo, ...data })
	}
}

export const UserInfo = Object.freeze({
	create: async (user_id: string) => {
		const userInfo = new baseUserInfo(user_id)

		const UserInfoData = await userInfoData.findByPk(user_id, true)

		return await userInfo.initMysUserInfoData(UserInfoData)
	},
	refresh: async (userInfo: baseUserInfo) => {
		const UserInfoData = await userInfoData.findByPk(userInfo.user_id, true)
		await userInfo.initMysUserInfoData(UserInfoData)
	}
})

export const updataCookie = async (
	stokenParams: {
		ltuid: string
		stoken: string
		mid: string
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

const refreshFucMap = new Map<string, (uidList: CoreRefreshUidData) => void>()
export const registerRefreshUidFuc = (key: string, fnc: (uidList: CoreRefreshUidData) => void) => {
	refreshFucMap.set(key, fnc)
}

export const refreshUid = async (options: {
	type: MysType
	ltuid: string
	cookie: string
}): Promise<{
	uids: CoreRefreshUidData,
	message: string
}> => {
	const res = await getUserGameRolesByCookie(options).request({})

	let message = ''
	const uidList = { data: {}, names: {} }
	if (res?.retcode === 0) {
		refreshFucMap.forEach(fnc => fnc(uidList))
	} else if (res?.retcode === -100) {
		message = "Cookie已失效，请重新#扫码登录或#刷新Cookie！"
	} else {
		message = res?.message || "刷新UID失败，请稍后再试！"
	}

	return {
		uids: uidList, message
	}
}