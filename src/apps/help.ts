import { karin } from 'node-karin'
import { config } from '@/utils'
import { Help } from '@/help'

export const help = karin.command(
	/^#?mys帮助/i,
	async (e) => {
		const image = await Help.render(config.pkg.name)
		if (!image) return true

		e.reply(image)
		return true
	}
)

Help.register(config.pkg.name, {
	version: config.pkg.version,
	...config.help()
})