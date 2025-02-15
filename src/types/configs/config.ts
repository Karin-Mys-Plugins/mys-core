import { Dialect } from '@/types'

export interface ConfigType {
	mihoyo_proxy: string
	dialect: Dialect
	postgres_host: string
	postgres_port: number
	postgres_username: string
	postgres_password: string
	postgres_database: string
}