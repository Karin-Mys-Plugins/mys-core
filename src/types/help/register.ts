export interface pluginHelpInfoDataType {
	/** 插件版本 */
	version?: string
	/** 插件帮助标题 */
	name: string
	/** 插件帮助描述 */
	desc?: string
	/** 帮助自定义背景图 */
	images?: backgroundImageType[]
	/** 内置命令图标 */
	icon: number
	/** 命令列表 */
	commandGroups: {
		/** 命令组名称 */
		name: string
		/** 命令组描述 */
		desc?: string
		/** 命令列表 */
		commands: {
			/** 命令示例 */
			name: string
			/** 命令描述 */
			desc?: string
			/** 自定义命令图标 */
			image?: string
			/** 内置命令图标 */
			icon?: number
		}[]
	}[]
	/** 展示其他帮助列表 */
	showOther?: boolean
}

export interface backgroundImageType {
	type: 'dir' | 'file' | 'url'
	path: string
}

export interface pluginHelpInfoType {
	/** 插件版本 */
	version: string
	/** 插件帮助标题 */
	name: string
	/** 插件帮助描述 */
	desc: string
	/** 帮助自定义背景图 */
	images: backgroundImageType[]
	/** 内置命令图标 */
	icon: string
	/** 命令列表 */
	commandGroups: HelpInfoCommandGroup[]
	/** 展示其他帮助列表 */
	showOther: boolean
}

export interface HelpInfoCommandGroup {
	/** 命令组名称 */
	name: string
	/** 命令组描述 */
	desc: string
	/** 命令列表 */
	commands: HelpInfoCommand[]
}

export interface HelpInfoCommand {
	/** 命令示例 */
	name: string
	/** 命令描述 */
	desc: string
	/** 自定义命令图标 */
	image?: string
	/** 内置命令图标 */
	icon: number | string
}