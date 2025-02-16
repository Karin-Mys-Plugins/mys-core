import { MysCoreDb, Column, ArrayColumn } from '@/dbs'
import { baseUserInfoDataType } from '@/types'

export const baseUserInfoDataSchema = {
	user_id: Column('STRING', {
		option: { primaryKey: true }
	}),
	ltuids: ArrayColumn('ltuids'),
	stuids: ArrayColumn('stuids')
}

export const userInfoData = await new MysCoreDb<baseUserInfoDataType>('userInfoData', baseUserInfoDataSchema).Init()