import lodash from 'node-karin/lodash'
import moment from 'node-karin/moment'

/**
 * 生成随机数
 * @param min - 最小值
 * @param max - 最大值
 */
export const random = (min: number, max: number) => lodash.random(min, max)

/**
 *  生成随机字符串
 * @param length - 字符串长度
 */
export const randomString = (length: number) => lodash.sampleSize('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', length).join('')

/**
 * 睡眠函数
 * @param ms - 毫秒
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 使用moment返回时间
 * @param format - 格式
 */
export const timef = (format = 'YYYY-MM-DD HH:mm:ss') => moment().format(format)

/**
 * 使用moment返回今日剩余时间
 */
export const getEndOfDay = () => Number(moment().endOf('day').format('X')) - Number(moment().format('X'))

/**
 * 将字符串解析为key-value键值对
 * @param Str - 字符串
 * @param sep - 分隔符
 */
export const strToObj = <
	D extends { [key: string]: string }
> (Str: string, sep: string | RegExp): Partial<D> => {
	const strArray = Str.split(sep)

	const strObj: { [key: string]: string } = {}

	for (const item of strArray) {
		const [key, value] = item.split('=')

		if (key) {
			strObj[key] = value || ''
		}
	}

	return strObj as Partial<D>
}

/**
 * 将key-value键值对解析为字符串
 * @param obj - key-value键值对
 * @param sep - 分隔符
 */
export const objToStr = (obj: { [key: string]: string | number }, sep: string) => {
	return Object.entries(obj).filter(([k, v]) => v).map(([k, v]) => `${k}=${v}`).join(sep) + sep
}

/** 
 * 生成设备guid 
 */
export const getDeviceGuid = () => {
	function S4 () {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
	}

	return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4())
}