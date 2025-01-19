import { karin } from 'node-karin'
import { CoreDirPath } from './dir'
import { RenderTempleType } from '@/types'

export const renderTemplate = async (template: RenderTempleType, options: {
	name?: string
	plugin: string
	data: any
}) => {
	await karin.render({
		name: options.name || options.plugin,
		file: `${CoreDirPath}/resources/template/${template}/index.html`,
		data: {
			defaultLayout: `${CoreDirPath}/resources/template/layout/default.html`,
			pluginName: options.plugin,
			...options.data
		}
	})
}