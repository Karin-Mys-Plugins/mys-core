import path from 'path'
import { fileURLToPath } from "url"

export const getDirPath = (url: string | URL, r: number) => {
	const filePath = fileURLToPath(url).replace(/\\/g, '/')
	return path.resolve(filePath, '../'.repeat(r))
}

export const CoreDirPath = getDirPath(import.meta.url, 3)