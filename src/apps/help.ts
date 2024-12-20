import { karin } from 'node-karin'
import { config } from '@/utils'
import { Help } from '@/help'

const pkg = config.pkg()

export const help = karin.command(
	/mys帮助/i,
	async (e) => {
		const image = await Help.render(pkg.name)
		if (!image) return true

		e.reply(image)
		return true
	}
)

Help.register(pkg.name, {
	version: pkg.version,
	...config.help()
})