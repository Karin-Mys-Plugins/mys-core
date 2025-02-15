import { Dialect, ModelAttributes } from '@/types'
import { config } from '@/utils'
import { basePath, mkdirSync } from 'node-karin'
import sqlModel, { Model, DataTypes, Op, Sequelize } from 'sequelize'

export { sqlModel, Model, Op }

export const checkDialect = (dialect: string) => {
	if (dialect === Dialect.postgres) {
		return Dialect.postgres
	} else {
		return Dialect.sqlite
	}
}

export const dialect = checkDialect(config.cfg().dialect)

export const sequelize = new class {
	declare sql: Sequelize

	Init () {
		if (this.sql) return this.sql

		if (dialect === Dialect.postgres) {
			const cfg = config.cfg()
			this.sql = new Sequelize({
				host: cfg.postgres_host,
				port: cfg.postgres_port,
				database: cfg.postgres_database,
				username: cfg.postgres_username,
				password: cfg.postgres_password,
				dialect: dialect,
				logging: false
			})
		} else {
			const dbPath = `${basePath}/data/${config.pkg.name}/db`

			mkdirSync(dbPath)

			this.sql = new Sequelize({
				storage: `${dbPath}/sqlite.db`,
				dialect: dialect,
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
	return dialect === Dialect.postgres ? {
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
	return dialect === Dialect.postgres ? {
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

export const InitDb = async<T extends Model> (
	model: sqlModel.ModelStatic<T>,
	COLUMNS: ModelAttributes<T>
) => {
	model.init(COLUMNS as any, {
		sequelize: sequelize.Init(),
		tableName: model.name
	})

	await model.sync()

	const queryInterface = sequelize.Init().getQueryInterface()
	const tableDescription = await queryInterface.describeTable(model.name)
	for (const key in COLUMNS) {
		if (!tableDescription[key]) {
			await queryInterface.addColumn(model.name, key, COLUMNS[key])
			if (typeof COLUMNS[key] === 'string') continue

			const defaultValue = (COLUMNS[key] as sqlModel.ModelAttributeColumnOptions<T>).defaultValue
			if (defaultValue !== undefined) {
				await model.update({ [key as any]: defaultValue }, { where: {} })
			}
		}
	}
}
