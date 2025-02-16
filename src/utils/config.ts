import { CoreBaseConfig, pluginHelpInfoDataType } from '@/types'
import { CoreDirPath } from '@/utils'
import {
	basePath,
	copyConfigSync,
	filesByExt,
	requireFileSync,
	watch,
	writeJsonSync
} from 'node-karin'
import lodash from 'node-karin/lodash'
import path from 'path'

/**
 * @description package.json
 */
export const pkg = requireFileSync(`${CoreDirPath}/package.json`)

class ConfigItem<T extends Record<string, any>> {
	ConfigPath: string
	/** 不要在外部直接使用该属性 */
	config: Record<string, any>

	constructor (config: T, configPath: string) {
		this.config = config
		this.ConfigPath = Object.freeze(configPath)

		return new Proxy(this, {
			get: (target, prop, receiver) => {
				if (prop === 'config') {
					return target.config
				}

				if (typeof prop === 'string' && target.config.hasOwnProperty(prop)) {
					return Object.freeze(target.config[prop])
				}

				return Reflect.get(target, prop, receiver)
			}
		})
	}

	save (saveData: Partial<T>) {
		for (const key in saveData) {
			if (this.config.hasOwnProperty(key)) {
				this.config[key] = saveData[key]
			}
		}

		writeJsonSync(this.ConfigPath, this.config)
	}
}

export class Config {
	/** @description 配置文件类型 */
	useType = '.json'
	/** @description 用户配置文件 */
	dirConfigPath: string
	/** @description 默认配置文件 */
	defConfigPath: string
	/** @description 缓存配置文件 */
	#catchConfig: Map<string, ConfigItem<Record<string, any>>> = new Map()

	constructor (dirPath: string, pkgName: string) {
		this.dirConfigPath = `${basePath}/${pkgName}/config`
		this.defConfigPath = `${dirPath}/config/config`

		/** @description 初始化配置文件 */
		copyConfigSync(this.defConfigPath, this.dirConfigPath, [this.useType])

		setTimeout(() => {
			const list = filesByExt(this.dirConfigPath, this.useType, 'abs')
			list.forEach(file => watch(file, () => {
				this.get(path.basename(file, this.useType), true)
			}))
		}, 2000)
	}

	get<T extends Record<string, any>> (name: string, force = false) {
		if (!force && this.#catchConfig.has(name)) {
			return Object.freeze(this.#catchConfig.get(name)! as unknown as T & { save (saveData: Record<string, string>): void })
		}

		const def = requireFileSync(`${this.defConfigPath}/${name}` + this.useType, {
			force: true
		})
		const cof = requireFileSync(`${this.dirConfigPath}/${name}` + this.useType, {
			force: true
		})

		const mergeCof = new ConfigItem(lodash.merge(def, cof), `${this.dirConfigPath}/${name}` + this.useType)
		this.#catchConfig.set(name, mergeCof)

		return Object.freeze(mergeCof as unknown as T & { save (saveData: Record<string, string>): void })
	}
}

export const CoreConfig = new Config(CoreDirPath, pkg.name)

/**
 * @description 基础配置文件
 */
export const base = () => CoreConfig.get<CoreBaseConfig>('base')

/**
 * @description 自定义帮助
 */
export const help = () => CoreConfig.get<pluginHelpInfoDataType>('help')