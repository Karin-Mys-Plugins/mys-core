import { logger } from 'node-karin'
import { config } from '@/utils'

/** 请不要在这编写插件 不会有任何效果~ */
logger.info(`${logger.violet(`[插件:${config.pkg.version}]`)} ${logger.green(config.pkg.name)} 初始化完成~`)