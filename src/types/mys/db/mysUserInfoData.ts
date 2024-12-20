import { MysType } from '..'

export interface MysUserInfoDataType {
	ltuid: string
	type: MysType
	cookie: string
	stoken: string
	mid: string
	ltoken: string
	deviceId: string
	loginTicket: string
}