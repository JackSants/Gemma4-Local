import fs from 'node:fs/promises'
import path from 'node:path'
import { MAX_READ_CHARS } from '../config.js'
import { ensureInsideRoot } from '../lib/fsUtils.js'

export async function readFileTool(root, filePath) {
  const target = ensureInsideRoot(root, path.join(root, filePath))
  const raw = await fs.readFile(target, 'utf8')
  return raw.slice(0, MAX_READ_CHARS)
}
