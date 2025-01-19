import {
	HelpInfoCommand,
	HelpInfoCommandGroup,
	RenderTempleType,
	pluginHelpInfoDataType,
	pluginHelpInfoType
} from '@/types'
import { CoreDirPath, renderTemplate } from '@/utils'
import fs from 'fs'
import { logger } from 'node-karin'
import lodash from 'node-karin/lodash'

export const Help = new class {
	#helpMap = new Map<string, pluginHelpInfoType>();

	register (plugin: string, info: pluginHelpInfoDataType) {
		if (!info.commandGroups?.length) {
			return false
		}

		try {
			const helpInfo: pluginHelpInfoType = {
				version: info.version || '',
				name: info.name || plugin,
				desc: info.desc || '',
				images: info.images || [],
				icon: this.getIcon(info.icon || 1),
				commandGroups: [],
				showOther: info.showOther ?? true
			}
			info.commandGroups.forEach(group => {
				if (group.name) {
					const commandGroup: HelpInfoCommandGroup = {
						name: group.name,
						desc: group.desc || '',
						commands: []
					}
					group.commands.forEach(command => {
						if (command.name) {
							commandGroup.commands.push({
								name: command.name,
								desc: command.desc || '',
								image: command.image,
								icon: this.getIcon(command.icon || 1),
							})
						}
					})
				}
			})

			this.#helpMap.set(plugin, helpInfo)

			return true
		} catch (err) {
			logger.error(err)
			return false
		}
	}

	getIcon (icon: number) {
		const Icon = Number(icon) || 1
		const x = (Icon - 1) % 10
		const y = (Icon - x - 1) / 10

		return `background-position:-${x * 50}px -${y * 50}px`
	}

	/**
	 * @param plugin 加载帮助时的plugin参数
	 * @param name 保存文件目录 推荐使用插件名称
	 */
	async render (plugin: string, name?: string) {
		const helpInfo = this.#helpMap.get(plugin)
		if (!helpInfo) return false

		let helpBackgroud = lodash.sample(helpInfo.images)
		if (helpBackgroud?.type === 'dir') {
			if (!fs.existsSync(helpBackgroud.path)) {
				helpBackgroud.path = ''
			} else {
				const files = fs.readdirSync(helpBackgroud.path)
				helpBackgroud.path = `${helpBackgroud.path}/${lodash.sample(files)}`
			}
		}

		if (helpInfo.showOther) {
			const otherHelp: HelpInfoCommand[] = []

			this.#helpMap.forEach((info, key) => {
				otherHelp.push({
					name: info.name,
					desc: info.desc,
					icon: info.icon,
				})
			})
			helpInfo.commandGroups.push({
				name: '其他插件帮助',
				desc: '',
				commands: otherHelp
			})
		}

		return await renderTemplate(RenderTempleType.Help, {
			name, plugin, data: {
				helpInfo, helpBackgroud,
				defaultBackgroud: `${CoreDirPath}/resources/image/help/background/default.png`
			}
		})
	}
}