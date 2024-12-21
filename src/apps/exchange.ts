import { miyolive_actId, miyolive_index, miyolive_refreshCode } from '@/mys/api'
import { Message, common, karin, logger, redis } from 'node-karin'

const getActId = async (uid: string, redisKey: string): Promise<{
	actId: string
	cache: boolean
}> => {
	const cacheActid = await redis.get(redisKey + 'actid')
	if (cacheActid) {
		return {
			actId: cacheActid, cache: true
		}
	}

	const ret = await miyolive_actId(uid).request({})
	if (ret?.retcode !== 0) {
		logger.error(`获取${uid}前瞻直播actid失败! retcode: ${ret.retcode}, message: ${ret.message}`)
		return { actId: '', cache: false }
	}

	for (const p of ret.data.list) {
		const post = p?.post?.post
		if (!post) continue

		const result = post.structured_content.match(
			/{\"link\":\"https:\/\/webstatic.mihoyo.com\/bbs\/event\/live\/index.html\?act_id=(.*?)\\/
		)
		if (result?.[1]) {
			return {
				actId: result[1], cache: false
			}
		}
	}

	return { actId: '', cache: false }
}

export const exchange = karin.handler(
	'mys_core.exchange',
	async (args) => {
		const { e, uid, game, name } = args as {
			e: Message; uid: string, game: string, name: string
		}

		const message = []
		const redisKey = `mys_core:${game}:exchange:`

		const cacheCodes = await redis.get(redisKey + 'codes')
		if (cacheCodes) {
			message.push(...JSON.parse(cacheCodes))
		} else {
			const { actId, cache: cacheActid } = await getActId(uid, redisKey)
			if (!actId) {
				e.reply(`当前暂无${name}前瞻直播兑换码`)
				return true
			}

			const index = await miyolive_index(actId).request({})
			const { title, code_ver, remain, is_end } = index?.data?.live || {}
			const codeTipText = JSON.parse(index?.data?.template)?.codeTipText || ''
			if (!title || !codeTipText || remain > 0) {
				e.reply(`当前暂无${title}-直播兑换码`)
				return true
			}

			const codes = await miyolive_refreshCode(actId).request({ code_ver })
			if (!codes?.data?.code_list?.length) {
				e.reply(`当前暂无${title}-直播兑换码`)
				return true
			}

			if (codes.data.code_list[0].to_get_time && !cacheActid) {
				await redis.set(redisKey + 'actid', actId, {
					EX: 60 * 60 * 24 * 7
				})
			}

			if (!codes.data.code_list[0].code) {
				e.reply(`当前暂无${title}-直播兑换码`)
				return true
			}

			const codesList = codes.data.code_list.map(val => val.code).filter(code => code)
			message.push(`${title}-直播兑换码`, codeTipText, ...codesList)

			is_end && await redis.set(redisKey + 'codes', JSON.stringify(message), {
				EX: 60 * 60 * 24 * 7
			})
		}

		await e.bot.sendForwardMsg(
			e.contact, common.makeForward(message, e.selfId, '匿名消息')
		)

		return true
	}
)