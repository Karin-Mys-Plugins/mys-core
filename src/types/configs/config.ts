import { Dialect } from '@/types'

export interface ConfigType {
	proxyHost: string
	proxyPort: number
	dialect: Dialect
	postgres: {
		host: string
		port: number
		database: string
		username: string
		password: string
	}
}