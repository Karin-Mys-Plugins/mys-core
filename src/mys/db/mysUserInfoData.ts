import { MysCoreDb, Column } from '@/dbs'
import { MysUserInfoDataType, MysType } from '@/types'
import { common } from '@/utils'

export const mysUserInfoData = new MysCoreDb<MysUserInfoDataType>('mysUserInfoData', {
	ltuid: Column('STRING', {
		option: { primaryKey: true }
	}),
	type: Column('STRING', { def: MysType.cn }),
	cookie: Column('TEXT'),
	stoken: Column('STRING'),
	mid: Column('STRING'),
	ltoken: Column('STRING'),
	deviceId: Column('STRING', { def: common.getDeviceGuid }),
	loginTicket: Column('STRING')
}).Init()