import { logger } from 'node-karin'
import { config } from '@/utils'

/** 请不要在这编写插件 不会有任何效果~ */
const pkg = config.pkg()
logger.info(`${logger.violet(`[插件:${pkg.version}]`)} ${logger.green(pkg.name)} 初始化完成~`)
