import { UserInfo, fetchQRcode, getTokenByGameToken, getUserFullInfo, queryQRcode, refreshUid, updataCookie } from '@/mys'
import { CoreRefreshUidData, MysType } from '@/types'
import { common } from '@/utils'
import karin, { logger, segment, } from 'node-karin'
import lodash from 'node-karin/lodash'
import QR from 'qrcode'

const QRCodes: Map<string, string | true> = new Map()

const bingCookie = async (userId: string, cookie: string, Serv?: MysType): Promise<string> => {
	const cookieObj = common.strToObj(cookie.replace(/[#'" ]/g, ''), ';')
	if (!cookieObj.cookie_token && !cookieObj.cookie_token_v2) {
		return '发送Cookie不完整，建议使用#扫码登录'
	}

	const ltuid = cookieObj.ltuid || cookieObj.login_uid || cookieObj.ltuid_v2 || cookieObj.account_id_v2 || cookieObj.ltmid_v2
	if (!ltuid) {
		return '发送Cookie不完整，建议使用#扫码登录'
	}

	let cookieParams: any
	let flagV2 = false
	if (cookieObj.cookie_token_v2 && (cookieObj.account_mid_v2 || cookieObj.ltmid_v2)) { //
		// account_mid_v2 为版本必须带的字段，不带的话会一直提示绑定cookie失败 请重新登录
		flagV2 = true
		cookieParams = {
			ltuid,
			account_mid_v2: cookieObj.account_mid_v2,
			cookie_token_v2: cookieObj.cookie_token_v2,
			ltoken_v2: cookieObj.ltoken_v2,
			ltmid_v2: cookieObj.ltmid_v2
		}
	} else {
		cookieParams = {
			ltuid, account_id: ltuid,
			ltoken: cookieObj.ltoken,
			cookie_token: cookieObj.cookie_token || cookieObj.cookie_token_v2
		}
	}
	if (cookieObj.mi18nLang) {
		cookieParams.mi18nLang = cookieObj.mi18nLang
	}

	const cookieStr = common.objToStr(cookieParams, ';')

	let uidList: {
		uids: CoreRefreshUidData
		message: string
	} = {
		uids: { data: {}, names: {} },
		message: "刷新UID失败，请稍后再试！"
	}
	let servType = Serv || MysType.cn
	for (const serv of Serv ? [Serv] : [MysType.cn, MysType.os]) {
		uidList = await refreshUid({
			type: serv, ltuid,
			cookie: cookieStr,
		})
		if (!uidList.message) {
			servType = serv
			break
		}
	}
	if (uidList.message) {
		return uidList.message
	}

	if (flagV2 && isNaN(Number(cookieParams.ltuid))) {
		const userFullInfo = await getUserFullInfo({
			type: servType, ltuid,
			cookie: cookieStr,
		}).request({})

		if (userFullInfo?.data?.user_info) {
			if (userFullInfo.data.user_info.uid) {
				cookieParams.ltuid = cookieParams.account_id = userFullInfo.data.user_info.uid
			}
		} else {
			logger.mark(`绑定Cookie错误2：${userFullInfo?.message || 'Cookie错误'}`)
			return `绑定Cookie失败：${userFullInfo?.message || 'Cookie错误'}`
		}
	}

	const userInfo = await UserInfo.create(userId)
	await userInfo.setUserInfoData({
		...uidList.uids.data,
		ltuids: lodash.uniq([...userInfo.ltuids, cookieParams.ltuid])
	})
	await userInfo.setMysUserInfoData(cookieParams.ltuid, {
		...cookieParams, type: servType
	})
	logger.mark(`[${userId}] 保存Cookie成功 [ltuid:${cookieParams.ltuid}]`)

	const sendMsg: string[] = []
	lodash.forEach(uidList.uids.data, (uids, game) => {
		sendMsg.push(`【${uidList.uids.names[game]}】：${uids.join('、')}`)
	})

	return `Cookie绑定成功！\n${sendMsg.join('\n')}`
}

const bingStoken = async (userId: string, stoken: string, Serv?: MysType): Promise<string> => {
	const stokenObj = common.strToObj(stoken.replace(/[#'" ]/g, ''), ';')

	if (!stokenObj.stoken || !(stokenObj.stuid || stokenObj.ltuid) || !stokenObj.ltoken || !stokenObj.mid) {
		return '发送Stoken不完整，建议使用#扫码登录'
	}
	const stokenParams = {
		ltuid: stokenObj.stuid || stokenObj.ltuid!,
		stoken: stokenObj.stoken,
		mid: stokenObj.mid,
		ltoken: stokenObj.ltoken
	}

	let servType = Serv || MysType.cn
	let updata: { cookie: string; message: string } = {} as any
	for (const serv of Serv ? [Serv] : [MysType.cn, MysType.os]) {
		updata = await updataCookie(stokenParams, serv)
		if (updata.cookie) {
			servType = serv
			break
		}
	}
	if (updata.message) {
		return updata.message
	}

	const userInfo = await UserInfo.create(userId)
	await userInfo.setUserInfoData({
		stuids: lodash.uniq([...userInfo.stuids, stokenParams.ltuid])
	})
	await userInfo.setMysUserInfoData(stokenParams.ltuid, {
		...stokenParams, type: servType
	})

	const sendMsg = []
	logger.mark(`[${userId}] 保存Stoken成功 [stuid:${stokenParams.ltuid}]`)
	sendMsg.push(`米游社ID：${stokenParams.ltuid}\nStoken绑定成功！`)

	sendMsg.push(await bingCookie(userId, updata.cookie, servType))

	return sendMsg.join('\n')
}

export const MiHoYoLoginQRCode = karin.command(
	new RegExp(`^#?(扫码|二维码|辅助)(登录|绑定|登陆)$`, 'i'),
	async (e) => {
		const qrcode = QRCodes.get(e.userId)
		if (qrcode) {
			if (qrcode === true) return true

			e.reply(['请使用米游社扫码登录', qrcode], {
				at: true, recallMsg: 60
			})

			return true
		}
		QRCodes.set(e.userId, true)

		const device = common.randomString(64)

		const QRcode = await fetchQRcode().request({ device })
		if (!QRcode?.data?.url) {
			QRCodes.delete(e.userId)
			e.reply('获取二维码失败、请稍后再试', { at: true })
			return true
		}

		const image = (await QR.toDataURL(QRcode.data.url)).replace('data:image/png;base64,', 'base64://')
		if (!image) {
			QRCodes.delete(e.userId)
			e.reply('生成二维码失败、请稍后再试', { at: true })
			return true
		}
		QRCodes.set(e.userId, image)
		e.reply(['请使用米游社扫码登录', segment.image(image)], { at: true, recallMsg: 60 })

		let data, Scanned
		const ticket = QRcode.data.url.split('ticket=')[1]
		for (let n = 1; n < 60; n++) {
			await common.sleep(5000)
			try {
				const res = await queryQRcode().request({ device, ticket })
				if (!res) continue

				if (res.retcode === 3503) {
					e.reply(res.message, { at: true, recallMsg: 60 })
					QRCodes.delete(e.userId)
					return true
				}

				if (res.retcode !== 0) {
					e.reply('二维码已过期，请重新登录', { at: true, recallMsg: 60 })
					QRCodes.delete(e.userId)
					return true
				}

				if (res.data.stat === 'Scanned' && !Scanned) {
					Scanned = true
					QRCodes.set(e.userId, true)
					e.reply('二维码已扫描，请确认登录', { at: true, recallMsg: 60 })
				}

				if (res.data.stat === 'Confirmed') {
					data = JSON.parse(res.data.payload.raw) as { uid: string, token: string }
					break
				}
			} catch (err) {
				logger.error(`[扫码登录] error：${err}`)
			}
		}
		if (!data?.uid && !data?.token) {
			e.reply('米游社登录失败', { at: true })
			QRCodes.delete(e.userId)
			return true
		}

		const userInfo = await UserInfo.create(e.userId)

		const res = await getTokenByGameToken().request({ account_id: parseInt(data.uid), game_token: data.token })
		if (!res) {
			e.reply('获取Token失败', { at: true })
			QRCodes.delete(e.userId)
			return true
		}

		const stoken = `stoken=${res.data.token.token};stuid=${res.data.user_info.aid};mid=${res.data.user_info.mid};`

		e.reply(await bingStoken(e.userId, stoken))
		QRCodes.delete(e.userId)

		return true
	}
)
