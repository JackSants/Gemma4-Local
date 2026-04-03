import fs from 'node:fs/promises'
import path from 'node:path'
import { ensureInsideRoot } from '../lib/fsUtils.js'

export async function listDir(root, dirPath = '.') {
  const target = ensureInsideRoot(root, path.join(root, dirPath))
  const entries = await fs.readdir(target, { withFileTypes: true })
  return entries.map((e) => ({
    name: e.name,
    type: e.isDirectory() ? 'dir' : e.isFile() ? 'file' : 'other'
  }))
}
