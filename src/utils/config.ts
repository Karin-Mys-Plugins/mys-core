import { dirPath } from '@/utils'
import { ConfigType, pluginHelpInfoDataType } from '@/types'
import {
	watch,
	logger,
	basePath,
	filesByExt,
	copyConfigSync,
	requireFileSync,
} from 'node-karin'
import lodash from 'node-karin/lodash'

/**
 * @description package.json
 */
export const pkg = () => requireFileSync(`${dirPath}/package.json`)

export const pkgName = pkg().name

const dirConfig = `${basePath}/${pkgName}/config`
const defConfig = `${dirPath}/config/config`

const getConfig = (name: string) => {
	const def = requireFileSync(`${defConfig}/${name}.yaml`)
	const cof = requireFileSync(`${dirConfig}/${name}.yaml`)

	return lodash.merge(def, cof)
}

/**
 * @description 初始化配置文件
 */
copyConfigSync(defConfig, dirConfig, ['.yaml'])

/**
 * @description 配置文件
 */
export const config = (): ConfigType => getConfig('config')

/**
 * @description 自定义帮助
 */
export const help = (): pluginHelpInfoDataType => getConfig('help')

/**
 * @description 监听配置文件
 */
setTimeout(() => {
	const list = filesByExt(dirConfig, '.yaml', 'abs')
	list.forEach(file => watch(file, (old, now) => {
		logger.info('旧数据:', old)
		logger.info('新数据:', now)
	}))
}, 2000)
