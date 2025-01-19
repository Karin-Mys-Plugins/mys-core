export type MysCoreReturnType<T> = T & {
	_save: (data: T) => Promise<void>
}