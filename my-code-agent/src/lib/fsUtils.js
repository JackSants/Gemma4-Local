import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { DEFAULT_IGNORES, MAX_FILE_BYTES } from '../config.js'

export function resolveRoot(root = '.') {
  return path.resolve(process.cwd(), root)
}

export function ensureInsideRoot(root, target) {
  const absRoot = path.resolve(root)
  const absTarget = path.resolve(target)
  const rel = path.relative(absRoot, absTarget)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Path fuori root consentita: ${absTarget}`)
  }
  return absTarget
}

export async function listFilesRecursive(root) {
  const files = []

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (DEFAULT_IGNORES.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile()) {
        files.push(full)
      }
    }
  }

  await walk(root)
  return files
}

export async function fileMeta(absPath, root) {
  const stats = await fs.stat(absPath)
  if (stats.size > MAX_FILE_BYTES) {
    return {
      path: path.relative(root, absPath),
      size: stats.size,
      mtimeMs: stats.mtimeMs,
      hash: null,
      skipped: 'too_large'
    }
  }

  const content = await fs.readFile(absPath)
  const hash = crypto.createHash('sha1').update(content).digest('hex')
  return {
    path: path.relative(root, absPath),
    size: stats.size,
    mtimeMs: stats.mtimeMs,
    hash,
    skipped: null
  }
}
