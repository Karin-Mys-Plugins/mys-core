import { Model, ModelAttributeColumnOptions } from 'sequelize'

export enum Dialect {
	sqlite = 'sqlite',
	postgres = 'postgres',
}

export type ModelAttributes<M extends Model = Model, TAttributes = any> = {
	[name in keyof TAttributes]: ModelAttributeColumnOptions<M>
}