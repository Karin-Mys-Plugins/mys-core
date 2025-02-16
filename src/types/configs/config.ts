import { Dialect } from '@/types'

export interface CoreBaseConfig {
	/** 米游社国际服代理 */
	mihoyo_proxy: string
	/** 数据库类型 */
	dialect: Dialect
	/** postgresql配置Host */
	postgres_host: string
	/** postgresql配置Port */
	postgres_port: number
	/** postgresql配置Database */
	postgres_username: string
	/** postgresql配置Username */
	postgres_password: string
	/** postgresql配置Password */
	postgres_database: string
}