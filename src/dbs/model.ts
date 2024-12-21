import { Dialect, ModelAttributes } from '@/types'
import { config, pkgName } from '@/utils'
import fs from 'fs'
import { basePath, existsSync, json, logger, mkdirSync } from 'node-karin'
import lodash from 'node-karin/lodash'
import { Model, checkDialect, sequelize, sqlModel } from './sequelize'

export class MysCoreDb<T extends { [key: string]: any }> {
	declare model: sqlModel.ModelStatic<Model<any, any>>

	modelName: string
	#modelSchema: ModelAttributes<Model>

	dataPath: string
	#useType?: 'file' | 'dir'

	sql = sequelize.Init()

	constructor (modelName: string, modelSchema: ModelAttributes<Model>, type?: 'file' | 'dir') {
		this.#useType = type

		this.modelName = modelName
		this.#modelSchema = modelSchema

		this.dataPath = `${basePath}/data/${pkgName}/${this.modelName}`
		if (type) {
			mkdirSync(this.dataPath)
		}
	}

	Init () {
		if (checkDialect(config.cfg().dialect) === Dialect.postgres || !this.#useType) {
			this.model = sequelize.Init().define(this.modelName, this.#modelSchema, {
				timestamps: false
			})
			this.model.sync()
		}

		return this
	}

	userPath (pk: string) {
		if (this.#useType === 'dir') {
			return `${this.dataPath}/${pk}`
		}

		return `${this.dataPath}/${pk}.json`
	}

	#readDirSync (pk: string): T {
		const path = this.userPath(pk)
		const files = fs.readdirSync(path)

		const result: { [key: string]: any } = {
			[this.model.primaryKeyAttribute]: pk
		}
		const filePromises = files.map(async (file) => {
			const data = await json.read(`${path}/${file}`)
			result[data.key] = data.data
		})
		Promise.all(filePromises).then().catch((err) => {
			logger.error(err)
		})

		return result as T
	}

	#writeDirSync (pk: string, data: T) {
		const path = this.userPath(pk)
		lodash.forEach(this.#modelSchema, (value, key) => {
			if (key !== this.model.primaryKeyAttribute) {
				const result = {
					[this.model.primaryKeyAttribute]: pk,
					key: key,
					data: data[key] || value.defaultValue
				}
				json.write(`${path}/${key}.json`, result)
			}
		})
		return true
	}

	schemaToJSON (pk: string): T {
		const result: { [key: string]: any } = {
			[this.model.primaryKeyAttribute]: pk
		}
		lodash.forEach(this.#modelSchema, (value, key) => {
			if (key !== this.model.primaryKeyAttribute) {
				result[key] = typeof value.defaultValue === 'function' ? value.defaultValue() : value.defaultValue
			}
		})

		return result as T
	}

	async findByPk (pk: string, create: true): Promise<T>
	async findByPk (pk: string, create?: false): Promise<T | undefined>
	async findByPk (pk: string, create: boolean = false): Promise<T | undefined> {
		if (checkDialect(config.cfg().dialect) === 'sqlite' && this.#useType) {
			const path = this.userPath(pk)
			if (!existsSync(path)) {
				if (create) {
					const data = this.schemaToJSON(pk)
					if (this.#useType === 'dir') {
						mkdirSync(path)
						this.#writeDirSync(pk, data)
					} else {
						json.writeSync(path, data)
					}

					return data
				}

				return undefined
			}

			if (this.#useType === 'dir') {
				return this.#readDirSync(pk)
			} else {
				return json.readSync(path) as T
			}
		} else {
			let result = await this.model.findByPk(pk)
			if (!result && create) {
				result = await this.model.create(this.schemaToJSON(pk))
			}
			return result?.toJSON<T>()
		}
	}

	async findAllByPks (pks: string[]): Promise<T[]> {
		if (checkDialect(config.cfg().dialect) === 'sqlite' && this.#useType) {
			const result: T[] = []
			pks.forEach((pk) => {
				const path = this.userPath(pk)
				if (existsSync(path)) {
					if (this.#useType === 'dir') {
						result.push(this.#readDirSync(pk))
					} else {
						result.push(json.readSync(path) as T)
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
			return result.map((item) => item.toJSON<T>())
		}
	}

	async update (pk: string, data: T): Promise<boolean> {
		if (checkDialect(config.cfg().dialect) === 'sqlite' && this.#useType) {
			if (this.#useType === 'dir') {
				this.#writeDirSync(pk, data)
			} else {
				json.writeSync(this.userPath(pk), data)
			}
			return true
		} else {
			if (this.model.primaryKeyAttribute in data) {
				delete data[this.model.primaryKeyAttribute]
			}
			const [affectedCount] = await this.model.update(data, {
				where: { [this.model.primaryKeyAttribute]: pk }
			})
			return affectedCount > 0
		}
	}

	async destroy (pk: string): Promise<boolean> {
		if (checkDialect(config.cfg().dialect) === 'sqlite' && this.#useType) {
			if (this.#useType === 'dir') {
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
