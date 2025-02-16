export type MysCoreReturnType<T> = T & {
	_save: (data: Record<string, any>) => Promise<void>
}