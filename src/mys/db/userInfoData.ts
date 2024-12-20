import { MysCoreDb, Column, ArrayColumn } from '@/dbs'
import { UserInfoDataType } from '@/types'

export const baseUserInfoDataSchema = {
	user_id: Column('STRING', {
		option: { primaryKey: true }
	}),
	ltuids: ArrayColumn('ltuids'),
	stuids: ArrayColumn('stuids')
}

export const userInfoData = new MysCoreDb<UserInfoDataType>('userInfoData', baseUserInfoDataSchema).Init()