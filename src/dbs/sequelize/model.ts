import { Dialect } from '@/types'
import { config } from '@/utils'
import { basePath, mkdirSync } from 'node-karin'
import sqlModel, { DataTypes, Model, Op, Sequelize } from 'sequelize'

export { Model, Op, sqlModel }

export const checkDialect = (dialect: string) => {
	if (dialect === Dialect.postgres) {
		return Dialect.postgres
	} else {
		return Dialect.sqlite
	}
}

export const sequelize = new class {
	declare sql: Sequelize
	#dialect: Dialect = Dialect.sqlite

	get Dialect () {
		return Object.freeze(this.#dialect)
	}

	Init (force = false) {
		const baseCfg = config.base()
		if (force) {
			this.#dialect = checkDialect(baseCfg.dialect)
		} else if (this.sql) {
			return this.sql
		}

		if (this.#dialect === Dialect.postgres) {
			this.sql = new Sequelize({
				host: baseCfg.postgres_host,
				port: baseCfg.postgres_port,
				database: baseCfg.postgres_database,
				username: baseCfg.postgres_username,
				password: baseCfg.postgres_password,
				dialect: this.#dialect,
				logging: false
			})
		} else {
			const dbPath = `${basePath}/data/${config.pkg.name}/db`
			mkdirSync(dbPath)

			this.sql = new Sequelize({
				storage: `${dbPath}/sqlite.db`,
				dialect: this.#dialect,
				logging: false
			})
		}

		return this.sql
	}
}

export const Column = (
	type: keyof typeof DataTypes,
	opt: { def?: any, option?: Partial<sqlModel.ModelAttributeColumnOptions<Model>> } = {}
) => {
	const { def = '', option = {} } = opt
	return {
		type: DataTypes[type],
		defaultValue: def,
		...option
	}
}

export const ArrayColumn = (key: string, options: {
	def?: string[],
	fn?: (data: string[]) => string[]
} = {}): any => {
	const { def = [], fn = false } = options
	return sequelize.Dialect === Dialect.postgres ? {
		type: DataTypes.JSONB,
		defaultValue: def,
		get (): string[] {
			return this.getDataValue(key).filter(Boolean)
		},
		set (data: string[] = def) {
			this.setDataValue(key, fn ? fn(data) : data)
		}
	} : {
		type: DataTypes.STRING,
		defaultValue: def.join(','),
		get (): string[] {
			return this.getDataValue(key).split(',').filter(Boolean)
		},
		set (data: string[] = def) {
			this.setDataValue(key, (fn ? fn(data) : data).join(','))
		}
	}
}

export const JsonColumn = (
	key: string,
	def: { [key in string]: any } = {}
): any => {
	return sequelize.Dialect === Dialect.postgres ? {
		type: DataTypes.JSONB,
		defaultValue: def
	} : {
		type: DataTypes.STRING,
		defaultValue: JSON.stringify(def),
		get (): { [key in string]: any } {
			let data = this.getDataValue(key)
			try {
				data = JSON.parse(data) || def
			} catch (e) {
				data = def
			}
			return data
		},
		set (data: { [key in string]: any }) {
			this.setDataValue(key, JSON.stringify(data))
		}
	}
}