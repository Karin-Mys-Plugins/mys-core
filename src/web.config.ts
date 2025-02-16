import { Dialect } from '@/types'
import { config } from '@/utils'
import { components } from 'node-karin'
import lodash from 'node-karin/lodash'

export default {
	info: {
		// 插件信息配置
	},
	/** 动态渲染的组件 */
	components: () => {
		const cfg = config.base()

		return [
			components.accordion.create('accordion-mys-core.config', {
				variant: 'shadow',
				selectionMode: 'multiple',
				selectionBehavior: 'toggle',
				showDivider: true,
				children: [
					components.accordion.createItem('children-mys-core.config', {
						title: '基础配置',
						children: [
							components.input.string('mys-core.config.mihoyo_proxy', {
								label: '米游社国际服代理',
								color: 'success',
								placeholder: "示例：http://127.0.0.1:8080",
								defaultValue: cfg.mihoyo_proxy,
								isClearable: true,
								isRequired: false,
								rules: [
									{
										regex: /^https?:\/\/(?:[\w-]+\.)+[\w-]+(:\d+)$/,
										error: '请输入正确的代理地址'
									}
								]
							}),
							components.divider.create('divider-mys-core-after.config.mihoyo_proxy'),
							components.radio.group('mys-core.config.dialect', {
								label: '数据库类型',
								description: "普通用户使用Sqlite即可，若切换至postgresql，请保存后重新进入配置界面填写postgresql配置！",
								isRequired: true,
								orientation: 'horizontal',
								defaultValue: cfg.dialect,
								radio: [
									components.radio.create('dialect-sqlite', {
										label: 'Sqlite',
										value: Dialect.sqlite
									}),
									components.radio.create('dialect-postgres', {
										label: 'Postgresql',
										value: Dialect.postgres
									})
								]
							}),
							...(cfg.dialect === Dialect.postgres ? [
								components.divider.create('divider-mys-core-after.config.dialect'),
								components.input.string('mys-core.config.postgres_host', {
									label: 'postgresql配置Host',
									defaultValue: 'localhost',
									placeholder: '请输入Host',
									isClearable: true,
									isRequired: true,
									rules: [
										{
											regex: /^(localhost|https?:\/\/(?:[\w-]+\.)+[\w-]+)$/,
											error: '请输入正确的Host'
										}
									]
								}),
								components.input.number('mys-core.config.postgres_port', {
									label: 'postgresql配置Port',
									defaultValue: '5432',
									placeholder: '请输入端口(0-65535)',
									isClearable: true,
									isRequired: true,
									rules: [
										{
											min: 1,
											max: 65535,
											error: '端口应在0-65535之间'
										}
									]
								}),
								components.input.string('mys-core.config.postgres_database', {
									label: 'postgresql配置Database',
									defaultValue: 'mys_core',
									placeholder: '请输入Database',
									isClearable: true,
									isRequired: true
								}),
								components.input.string('mys-core.config.postgres_username', {
									label: 'postgresql配置Username',
									defaultValue: 'postgres',
									placeholder: '请输入Username',
									isClearable: true,
									isRequired: true
								}),
								components.input.string('mys-core.config.postgres_password', {
									label: 'postgresql配置Password',
									defaultValue: 'a123456',
									placeholder: '请输入Password',
									isClearable: true,
									isRequired: false
								})
							] : [])
						]
					}),
				]
			})
		]
	},

	/** 前端点击保存之后调用的方法 */
	save: (configData: Record<string, Record<string, string>[]>) => {
		console.log('保存的配置:', configData)
		// 在这里处理保存逻辑

		const message = ['保存成功ε٩(๑> ₃ <)۶з']
		for (const accordionKey in configData) {
			const name = accordionKey.split('.')[1]
			const Config = config.CoreConfig.get(name)

			const mergeData: Record<string, string> = {}
			configData[accordionKey].map((accordionItem) => {
				lodash.forEach(accordionItem, (value, key) => {
					mergeData[key.split('.')[2]] = value
				})
			})
			Config.save(mergeData)
			if (name === 'config' && mergeData.dialect === Dialect.postgres && !('postgres_host' in mergeData)) {
				message.push('请重新进入配置界面填写postgresql配置!')
			}
		}

		return {
			success: true,
			message: message.join('\n')
		}
	}
}