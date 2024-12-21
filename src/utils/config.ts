import { dirPath } from '@/utils'
import { ConfigType, pluginHelpInfoDataType } from '@/types'
import {
	watch,
	basePath,
	filesByExt,
	copyConfigSync,
	requireFileSync,
} from 'node-karin'
import lodash from 'node-karin/lodash'

/**
 * @description package.json
 */
export const pkg = requireFileSync(`${dirPath}/package.json`)

export class Config {
	/** @description 用户配置文件 */
	dirConfig: string
	/** @description 默认配置文件 */
	defConfig: string
	constructor (dirPath: string, pkgName: string) {
		this.dirConfig = `${basePath}/${pkgName}/config`
		this.defConfig = `${dirPath}/config/config`

		/** @description 初始化配置文件 */
		copyConfigSync(this.defConfig, this.dirConfig, ['.yaml'])
	}

	get (name: string) {
		const def = requireFileSync(`${this.defConfig}/${name}.yaml`)
		const cof = requireFileSync(`${this.dirConfig}/${name}.yaml`)

		return lodash.merge(def, cof)
	}

	watch (fn: (file: string) => (old: any, now: any) => void) {
		setTimeout(() => {
			const list = filesByExt(this.dirConfig, '.yaml', 'abs')
			list.forEach(file => watch(file, fn(file)))
		}, 2000)
	}
}

const CoreConfig = new Config(dirPath, pkg.name)

/**
 * @description 配置文件
 */
export const cfg = (): ConfigType => CoreConfig.get('config')

/**
 * @description 自定义帮助
 */
export const help = (): pluginHelpInfoDataType => CoreConfig.get('help')