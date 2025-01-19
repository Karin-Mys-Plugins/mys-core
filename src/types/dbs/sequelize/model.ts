import Model from 'sequelize'

export const enum Dialect {
	sqlite = 'sqlite',
	postgres = 'postgres',
}

export type ModelAttributes<M extends Model.Model = Model.Model, TAttributes = any> = {
	[name in keyof TAttributes]: Model.ModelAttributeColumnOptions<M>
}