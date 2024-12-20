import { MysUserInfoDataType } from '..'

export interface UserInfoLtuidMapType extends MysUserInfoDataType {
	perm: (0 | 1 | 2 | 3) & number
}