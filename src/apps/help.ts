import { karin } from 'node-karin'
import { CoreCfg } from '@/utils'
import { Help } from '@/help'

export const help = karin.command(
	/^#?mys帮助/i,
	async (e) => {
		const image = await Help.render(CoreCfg.pkg.name)
		if (!image) return true

		e.reply(image)
		return true
	}
)

Help.register(CoreCfg.pkg.name, {
	version: CoreCfg.pkg.version,
	...CoreCfg.help()
})