import Model from 'sequelize'

export enum Dialect {
	sqlite = 'sqlite',
	postgres = 'postgres',
}

export type ModelAttributes<M extends Model.Model = Model.Model, TAttributes = any> = {
	[name in keyof TAttributes]: Model.ModelAttributeColumnOptions<M>
}