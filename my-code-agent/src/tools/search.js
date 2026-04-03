import { spawn } from 'node:child_process'
import path from 'node:path'
import { ensureInsideRoot } from '../lib/fsUtils.js'

function runRg(query, root) {
  return new Promise((resolve) => {
    const proc = spawn('rg', ['-n', '--hidden', '-g', '!.git', query, '.'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let out = ''
    let err = ''

    proc.stdout.on('data', (d) => {
      out += d.toString()
    })
    proc.stderr.on('data', (d) => {
      err += d.toString()
    })

    proc.on('close', (code) => {
      if (code === 0 || code === 1) {
        const lines = out.trim() ? out.trim().split('\n').slice(0, 200) : []
        resolve({ ok: true, lines })
        return
      }
      resolve({ ok: false, lines: [], error: err || `rg exit ${code}` })
    })

    proc.on('error', () => {
      resolve({ ok: false, lines: [], error: 'rg non disponibile' })
    })
  })
}

export async function searchTool(root, query) {
  const safeRoot = ensureInsideRoot(root, root)
  const result = await runRg(query, path.resolve(safeRoot))
  if (!result.ok) return []
  return result.lines
}
