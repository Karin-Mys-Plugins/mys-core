import { logger } from 'node-karin'
import { CoreCfg } from '@/utils'

/** 请不要在这编写插件 不会有任何效果~ */
logger.info(`${logger.violet(`[插件:${CoreCfg.pkg.version}]`)} ${logger.green(CoreCfg.pkg.name)} 初始化完成~`)