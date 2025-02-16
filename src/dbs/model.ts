import { Dialect, ModelAttributes, MysCoreReturnType } from '@/types'
import { config } from '@/utils'
import fs from 'fs'
import { basePath, existsSync, json, logger, mkdirSync } from 'node-karin'
import lodash from 'node-karin/lodash'
import { Model, checkDialect, sequelize, sqlModel } from './sequelize'

const saveFile = <T extends Record<string, any>> (self: MysCoreDb<T>, pk: string) => {
	return async (data: Record<string, any>) => {
		delete data[self.model.primaryKeyAttribute]

		self.writeFileSync(pk, data)
	}
}

const saveDir = <T extends Record<string, any>> (self: MysCoreDb<T>, pk: string) => {
	return async (data: Record<string, any>) => {
		delete data[self.model.primaryKeyAttribute]

		self.writeDirSync(pk, data)
	}
}

const saveSql = <T extends Record<string, any>> (self: MysCoreDb<T>, model: Model<any, any>, pk: string) => {
	return async (data: Record<string, any>) => {
		delete data[self.model.primaryKeyAttribute]

		if (checkDialect(config.base().dialect) === Dialect.postgres && self.useType) {
			if (self.useType === 'dir') {
				self.writeDirSync(pk, data)
			} else {
				self.writeFileSync(pk, data)
			}
		}

		const Attributes = self.schemaToJSON(pk)
		for (const key in data) {
			!(key in Attributes) && delete data[key]
		}

		await model.update(data)
	}
}

export class MysCoreDb<T extends Record<string, any>> {
	declare model: sqlModel.ModelStatic<Model<any, any>>

	modelName: string
	#modelSchema: ModelAttributes<Model>

	dataPath: string
	useType?: 'file' | 'dir'

	sql = sequelize.Init()

	constructor (modelName: string, modelSchema: ModelAttributes<Model>, type?: 'file' | 'dir') {
		this.useType = type

		this.modelName = modelName
		this.#modelSchema = modelSchema

		this.dataPath = `${basePath}/data/${config.pkg.name}/${this.modelName}`
		if (type) {
			mkdirSync(this.dataPath)
		}
	}

	async Init () {
		if (checkDialect(config.base().dialect) === Dialect.postgres || !this.useType) {
			this.model = sequelize.Init().define(this.modelName, this.#modelSchema, {
				timestamps: false
			})
			this.model.sync()

			const queryInterface = sequelize.Init().getQueryInterface()
			const tableDescription = await queryInterface.describeTable(this.modelName)
			for (const key in this.#modelSchema) {
				if (!tableDescription[key]) {
					await queryInterface.addColumn(this.modelName, key, this.#modelSchema[key])
					if (typeof this.#modelSchema[key] === 'string') continue

					const defaultValue = (this.#modelSchema[key] as any).defaultValue
					if (defaultValue !== undefined) {
						await this.model.update({ [key]: defaultValue }, { where: {} })
					}
				}
			}
		}

		return this
	}

	userPath (pk: string) {
		if (this.useType === 'dir') {
			return `${this.dataPath}/${pk}`
		}

		return `${this.dataPath}/${pk}.json`
	}

	#readSync (path: string, pk: string): MysCoreReturnType<T> {
		const result: MysCoreReturnType<T> = json.readSync(path)
		result._save = saveFile(this, pk)

		return result
	}

	#readDirSync (pk: string): MysCoreReturnType<T> {
		const path = this.userPath(pk)
		const files = fs.readdirSync(path)

		const result: Record<string, any> = {
			_save: saveDir<T>(this, pk),
			[this.model.primaryKeyAttribute]: pk
		}
		const filePromises = files.map(async (file) => {
			const data = await json.read(`${path}/${file}`)
			result[data.key] = data.data
		})
		Promise.all(filePromises).then().catch((err) => {
			logger.error(err)
		})

		return result as MysCoreReturnType<T>
	}

	writeFileSync (pk: string, data: Record<string, any>) {
		const def_data = this.schemaToJSON(pk)
		for (const key in data) {
			!(key in def_data) && delete data[key]
		}

		json.writeSync(this.userPath(pk), lodash.merge(def_data, data))

		return true
	}

	writeDirSync (pk: string, data: Record<string, any>) {
		const path = this.userPath(pk)
		lodash.forEach(this.#modelSchema, (value, key) => {
			if (key !== this.model.primaryKeyAttribute) {
				const result = {
					key: key,
					[this.model.primaryKeyAttribute]: pk,
					data: data[key] || value.defaultValue
				}
				json.writeSync(`${path}/${key}.json`, result)
			}
		})
		return true
	}

	schemaToJSON (pk: string): T {
		const result: Record<string, any> = {
			[this.model.primaryKeyAttribute]: pk
		}
		lodash.forEach(this.#modelSchema, (value, key) => {
			if (key !== this.model.primaryKeyAttribute) {
				result[key] = typeof value.defaultValue === 'function' ? value.defaultValue() : value.defaultValue
			}
		})

		return result as T
	}

	async findByPk (pk: string, create: true): Promise<MysCoreReturnType<T>>
	async findByPk (pk: string, create?: false): Promise<MysCoreReturnType<T> | undefined>
	async findByPk (pk: string, create: boolean = false): Promise<MysCoreReturnType<T> | undefined> {
		if (checkDialect(config.base().dialect) === 'sqlite' && this.useType) {
			const path = this.userPath(pk)
			if (!existsSync(path)) {
				if (create) {
					const data = this.schemaToJSON(pk)
					if (this.useType === 'dir') {
						mkdirSync(path)
						this.writeDirSync(pk, data)
					} else {
						json.writeSync(path, data)
					}

					return {
						...data, _save: saveFile<T>(this, pk)
					}
				}

				return undefined
			}

			if (this.useType === 'dir') {
				return this.#readDirSync(pk)
			} else {
				return this.#readSync(path, pk)
			}
		} else {
			let result = await this.model.findByPk(pk)
			if (!result && create) {
				result = await this.model.create(this.schemaToJSON(pk))
			}
			if (!result) return undefined

			return {
				...result.toJSON<T>(),
				_save: saveSql<T>(this, result, pk)
			}
		}
	}

	async findAllByPks (pks: string[]): Promise<MysCoreReturnType<T>[]> {
		if (checkDialect(config.base().dialect) === 'sqlite' && this.useType) {
			const result: MysCoreReturnType<T>[] = []
			pks.forEach((pk) => {
				const path = this.userPath(pk)
				if (existsSync(path)) {
					if (this.useType === 'dir') {
						result.push(this.#readDirSync(pk))
					} else {
						result.push(this.#readSync(path, pk))
					}
				}
			})

			return result
		} else {
			const result = await this.model.findAll({
				where: {
					[this.model.primaryKeyAttribute]: pks
				}
			})
			return result.map((item) => ({
				...item.toJSON<T>(),
				_save: saveSql<T>(this, item, item[this.model.primaryKeyAttribute as keyof Model<any, any>])
			}))
		}
	}

	async destroy (pk: string): Promise<boolean> {
		if (checkDialect(config.base().dialect) === 'sqlite' && this.useType) {
			if (this.useType === 'dir') {
				fs.rmdirSync(this.userPath(pk), { recursive: true })
			} else {
				fs.unlinkSync(this.userPath(pk))
			}
			return true
		} else {
			const destroyed = await this.model.destroy({
				where: { [this.model.primaryKeyAttribute]: pk }
			})
			return destroyed > 0
		}
	}
}
