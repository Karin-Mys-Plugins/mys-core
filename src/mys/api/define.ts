import { BaseMysResDataType, MysApiInfo, MysType, requestMethod, UidInfo } from '@/types'
import { common } from '@/utils'
import md5 from 'md5'
import { handler, logger } from 'node-karin'
import axios, { AxiosHeaders, AxiosRequestConfig } from 'node-karin/axios'
import lodash from 'node-karin/lodash'
import { MysApp } from '.'

export class defineMysApi<
	R extends BaseMysResDataType & { [key: string]: any } | undefined = undefined,
	D extends { [key: string]: any } = {}
> {
	uidInfo: UidInfo
	#apiInfo: MysApiInfo<R, D>

	#needDeviceFp: boolean = false
	#needCheckCode: boolean = false

	constructor (info: MysApiInfo<R, D>, uidInfo?: UidInfo, deviceFp: boolean = false, checkCode: boolean = false) {
		this.uidInfo = uidInfo as UidInfo
		this.#apiInfo = Object.freeze(info)

		this.#needDeviceFp = deviceFp
		this.#needCheckCode = checkCode
	}

	get apiInfo () {
		return this.#apiInfo
	}

	get isHoyolab () {
		return this.uidInfo.type === MysType.os
	}

	get deviceName () {
		return `Karin-${md5(this.uidInfo.ltuid).substring(0, 5)}`
	}

	async request (data: D, checkCode: boolean = true): Promise<R> {
		const Url = this.#apiInfo.url(this, data)
		const Body = this.#apiInfo.body?.(this, data)
		const Headers = new AxiosHeaders(this.#apiInfo.headers?.(this, {
			query: Url.search.substring(1), body: Body
		}))

		if (this.#needDeviceFp) {

		}

		const params: AxiosRequestConfig = {
			url: Url.href, method: this.#apiInfo.method, data: Body, headers: Headers
		}

		const start = Date.now()
		let response: any = undefined
		try {
			if (this.#apiInfo.method === requestMethod.GET) {
				response = await axios.get(params.url!)
			} else if (this.#apiInfo.method === requestMethod.POST) {
				response = await axios.post(params.url!)
			} else {
				response = axios.request(params)
			}
		} catch (err) {
			logger.debug(`mys-core-requst[${logger.green(`${Date.now() - start}ms`)}]: ${JSON.stringify(params, null, 2)}`)

			return response
		}

		const res = response.data

		logger.debug(`mys-core-requst[${logger.green(`${Date.now() - start}ms`)}]: ${JSON.stringify(params, null, 2)} -> ${JSON.stringify(res, null, 2)}`)

		if (!res) {
			return undefined as R
		}

		if ('retcode' in res) {
			res.retcode = Number(res.retcode)
		}

		if (this.#needCheckCode && checkCode) {
			return await this.checkRetCode(res, data)
		}

		return res
	}

	async checkRetCode (res: BaseMysResDataType & { [key: string]: any }, data?: D, validate: boolean = true): Promise<R> {
		const err = (msg: string) => {
			if (!res.error) {
				res.error = []
			}
			res.error.push(msg)
		}

		switch (res.retcode) {
			case 0:
				break
			case -1:
			case -100:
			case 1001:
			case 10001:
			case 10103:
				if (/(登录|login)/i.test(res.message)) {

				} else {

				}
			case 1008:
				break
			case 10101:
				break
			case 10102:
				if (res.message === 'Data is not public for the user') {

				} else {

				}
				break
			// 伙伴不存在~
			case -1002:
				break
			case 1034:
			case 5003:
			case 10035:
			case 10041:
				if (handler.has('mys.req.validate') && validate) {
					const result = await handler.call<R>('mys.req.validate', { data, apiInfo: this.apiInfo, uidInfo: this.uidInfo })
					if (result) {
						return await this.checkRetCode(result, data, false)
					}

					return result
				} else if (!validate) {
					if ([5003, 10041].some(code => code === res.retcode)) {

					} else {

					}
				}

				break
			case 10307:
				break
			default:
				break
		}

		return res as R
	}

	getDS1 (query: string, body: string, saltKey: keyof typeof MysApp.salt) {
		const r = common.randomString(6)
		const t = Math.floor(Date.now() / 1000)
		let DS = `salt=${MysApp.salt[saltKey]}&t=${t}&r=${r}`
		if (query || body) DS += `&b=${body}&q=${query}`

		return `${t},${r},${md5(DS)}`
	}

	getDS2 (query: string, body: string, saltKey: keyof typeof MysApp.salt) {
		const r = lodash.random(100001, 200000)
		const t = Math.floor(Date.now() / 1000)

		return `${t},${r},${md5(`salt=${MysApp.salt[saltKey]}&t=${t}&r=${r}&b=${body}&q=${query}`)}`
	}
}