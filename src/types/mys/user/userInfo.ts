import { MysUserInfoDataType } from '..'

export interface UserInfoLtuidMapType extends MysUserInfoDataType {
	perm: (0 | 1 | 2 | 3) & number
}
export interface CoreRefreshUidData {
	data: { [key: string]: string[] }
	names: { [key: string]: string }
}