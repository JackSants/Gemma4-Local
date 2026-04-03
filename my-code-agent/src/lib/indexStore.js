import fs from 'node:fs/promises'
import path from 'node:path'

export async function saveIndex(root, indexData) {
  const dir = path.join(root, '.my-agent')
  await fs.mkdir(dir, { recursive: true })
  const out = path.join(dir, 'index.json')
  await fs.writeFile(out, JSON.stringify(indexData, null, 2), 'utf8')
  return out
}

export async function loadIndex(root) {
  const file = path.join(root, '.my-agent', 'index.json')
  const raw = await fs.readFile(file, 'utf8')
  return JSON.parse(raw)
}
