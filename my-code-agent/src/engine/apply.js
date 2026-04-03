import fs from 'node:fs/promises'
import path from 'node:path'

function parseReplaceInstruction(instruction) {
  const match = instruction.match(/sostituisci\s+"([\s\S]+?)"\s+con\s+"([\s\S]+?)"/i)
  if (!match) return null
  return { oldText: match[1], newText: match[2] }
}

function parseInsertInstruction(instruction) {
  const afterMatch = instruction.match(/inserisci\s+"([\s\S]+?)"\s+dopo\s+"([\s\S]+?)"/i)
  if (afterMatch) {
    return { mode: 'after', text: afterMatch[1], anchor: afterMatch[2] }
  }

  const beforeMatch = instruction.match(/inserisci\s+"([\s\S]+?)"\s+prima\s+di\s+"([\s\S]+?)"/i)
  if (beforeMatch) {
    return { mode: 'before', text: beforeMatch[1], anchor: beforeMatch[2] }
  }

  return null
}

function parseRemoveInstruction(instruction) {
  const match = instruction.match(/rimuovi\s+"([\s\S]+?)"/i)
  if (!match) return null
  return { text: match[1] }
}

function parseCenterSelectorInstruction(instruction) {
  const q = instruction.toLowerCase()
  const centerIntent = q.includes('centr') || q.includes('center') || q.includes('allinea')
  if (!centerIntent) return null

  const selectors = ['footer', 'header', 'nav', '.footer', '.header', '.nav']
  const selector = selectors.find((s) => q.includes(s.replace('.', '')))
  if (!selector) return null

  return { selector }
}

function parseRestoreInstruction(instruction) {
  const q = instruction.toLowerCase()
  const hasRestoreIntent =
    q.includes('ripristin') ||
    q.includes('torna') ||
    q.includes('precedent') ||
    q.includes('annulla') ||
    q.includes('undo')

  return hasRestoreIntent
}

function selectorToRegex(selector) {
  return new RegExp(`${selector.replace('.', '\\.')}\\s*\\{[\\s\\S]*?\\}`, 'm')
}

function updateCssBlockCenter(content, selector) {
  const selectorRegex = selectorToRegex(selector)
  const match = content.match(selectorRegex)
  if (!match) return { changed: false, content }

  let block = match[0]
  let changed = false

  if (block.includes('justify-content: space-between;')) {
    block = block.replace('justify-content: space-between;', 'justify-content: center;')
    changed = true
  }

  if (block.includes('flex-wrap: gap;')) {
    block = block.replace('flex-wrap: gap;', 'gap: 10px;')
    changed = true
  }

  if (!block.includes('display: flex;')) {
    block = block.replace(/\{\s*/, '{\n      display: flex;\n')
    changed = true
  }

  if (!block.includes('flex-direction: column;')) {
    block = block.replace('display: flex;', 'display: flex;\n      flex-direction: column;')
    changed = true
  }

  if (!block.includes('align-items: center;')) {
    block = block.replace(/\}\s*$/, '      align-items: center;\n    }')
    changed = true
  }

  if (!block.includes('justify-content: center;')) {
    block = block.replace(/\}\s*$/, '      justify-content: center;\n    }')
    changed = true
  }

  if (!block.includes('text-align: center;')) {
    block = block.replace(/\}\s*$/, '      text-align: center;\n    }')
    changed = true
  }

  if (!block.includes('gap:')) {
    block = block.replace(/\}\s*$/, '      gap: 10px;\n    }')
    changed = true
  }

  if (!changed) return { changed: false, content }
  return { changed: true, content: content.replace(match[0], block) }
}

function applyInsert(content, insertSpec, selectorHint = null) {
  const anchor = insertSpec.anchor
  const text = insertSpec.text

  if (selectorHint) {
    const selectorRegex = selectorToRegex(selectorHint)
    const match = content.match(selectorRegex)
    if (!match) return { changed: false, content }
    if (!match[0].includes(anchor)) return { changed: false, content }

    const newBlock =
      insertSpec.mode === 'after'
        ? match[0].replace(anchor, `${anchor}${text}`)
        : match[0].replace(anchor, `${text}${anchor}`)

    return { changed: true, content: content.replace(match[0], newBlock) }
  }

  if (!content.includes(anchor)) return { changed: false, content }
  const updated =
    insertSpec.mode === 'after'
      ? content.replace(anchor, `${anchor}${text}`)
      : content.replace(anchor, `${text}${anchor}`)
  return { changed: true, content: updated }
}

function applyRemove(content, removeSpec, selectorHint = null) {
  if (selectorHint) {
    const selectorRegex = selectorToRegex(selectorHint)
    const match = content.match(selectorRegex)
    if (!match) return { changed: false, content }
    if (!match[0].includes(removeSpec.text)) return { changed: false, content }
    const newBlock = match[0].replace(removeSpec.text, '')
    return { changed: true, content: content.replace(match[0], newBlock) }
  }

  if (!content.includes(removeSpec.text)) return { changed: false, content }
  return { changed: true, content: content.replace(removeSpec.text, '') }
}

function applyScopedReplace(content, oldText, newText, selectorHint = null) {
  if (selectorHint) {
    const selectorRegex = selectorToRegex(selectorHint)
    const match = content.match(selectorRegex)
    if (!match) return { changed: false, content }

    if (!match[0].includes(oldText)) return { changed: false, content }
    const newBlock = match[0].replace(oldText, newText)
    return { changed: true, content: content.replace(match[0], newBlock) }
  }

  if (!content.includes(oldText)) return { changed: false, content }
  return { changed: true, content: content.replace(oldText, newText) }
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function backupFile(root, relPath, raw, snapshotId) {
  const backupDir = path.join(root, '.my-agent', 'backups', snapshotId)
  const backupPath = path.join(backupDir, relPath)
  await fs.mkdir(path.dirname(backupPath), { recursive: true })
  await fs.writeFile(backupPath, raw, 'utf8')
}

function collectTargets(indexData, targetFile) {
  if (targetFile) return [targetFile]

  return indexData.files
    .filter((f) => !f.skipped)
    .map((f) => f.path)
    .filter((p) => p.endsWith('.html') || p.endsWith('.css') || p.endsWith('.js') || p.endsWith('.ts'))
}

function tokenizeInstruction(instruction) {
  return instruction
    .toLowerCase()
    .replace(/[^a-z0-9_\-/ ]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

function inferTargets(indexData, instruction, targetFile) {
  const all = collectTargets(indexData, targetFile)
  if (targetFile) return all
  if (all.length <= 1) return all

  const tokens = tokenizeInstruction(instruction)
  const scored = all
    .map((file) => {
      const p = file.toLowerCase()
      let score = 0

      for (const t of tokens) {
        if (p.includes(t)) score += 2
      }

      if ((instruction.toLowerCase().includes('footer') || instruction.toLowerCase().includes('header') || instruction.toLowerCase().includes('nav')) &&
        (p.endsWith('.html') || p.endsWith('.css'))) {
        score += 3
      }

      if (p.endsWith('.html')) score += 1
      if (p.endsWith('.css')) score += 1
      if (p.includes('.my-agent/')) score -= 20

      return { file, score }
    })
    .sort((a, b) => b.score - a.score || a.file.length - b.file.length)

  const topScore = scored[0]?.score ?? 0
  if (topScore <= 0) {
    return [scored[0].file]
  }

  return scored.filter((s) => s.score >= topScore - 1).slice(0, 3).map((s) => s.file)
}

async function listSnapshotIds(root) {
  const backupRoot = path.join(root, '.my-agent', 'backups')
  if (!(await fileExists(backupRoot))) return []

  const entries = await fs.readdir(backupRoot, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => (a > b ? -1 : a < b ? 1 : 0))
}

async function walkFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const out = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await walkFiles(full, baseDir)
      out.push(...nested)
    } else if (entry.isFile()) {
      out.push(path.relative(baseDir, full))
    }
  }

  return out
}

export async function restoreFromBackup(root, targetFile = null) {
  const snapshotIds = await listSnapshotIds(root)
  if (snapshotIds.length === 0) {
    return {
      ok: false,
      changedFiles: [],
      message: 'Nessun backup disponibile in .my-agent/backups.'
    }
  }

  const backupRoot = path.join(root, '.my-agent', 'backups')

  if (targetFile) {
    for (const snapshotId of snapshotIds) {
      const backupPath = path.join(backupRoot, snapshotId, targetFile)
      if (!(await fileExists(backupPath))) continue

      const backupRaw = await fs.readFile(backupPath, 'utf8')
      const targetAbs = path.join(root, targetFile)
      await fs.mkdir(path.dirname(targetAbs), { recursive: true })
      await fs.writeFile(targetAbs, backupRaw, 'utf8')

      return {
        ok: true,
        changedFiles: [targetFile],
        message: `Ripristino completato da backup ${snapshotId} per ${targetFile}.`
      }
    }

    return {
      ok: false,
      changedFiles: [],
      message: `Nessun backup trovato per il file ${targetFile}.`
    }
  }

  const latest = snapshotIds[0]
  const snapshotDir = path.join(backupRoot, latest)
  const files = await walkFiles(snapshotDir)

  if (files.length === 0) {
    return {
      ok: false,
      changedFiles: [],
      message: `Backup ${latest} vuoto.`
    }
  }

  for (const rel of files) {
    const backupPath = path.join(snapshotDir, rel)
    const targetAbs = path.join(root, rel)
    const raw = await fs.readFile(backupPath, 'utf8')
    await fs.mkdir(path.dirname(targetAbs), { recursive: true })
    await fs.writeFile(targetAbs, raw, 'utf8')
  }

  return {
    ok: true,
    changedFiles: files,
    message: `Ripristino completato dallo snapshot ${latest} (${files.length} file).`
  }
}

export async function applyInstruction(root, indexData, instruction, targetFile = null) {
  if (parseRestoreInstruction(instruction)) {
    return restoreFromBackup(root, targetFile)
  }

  const centerSpec = parseCenterSelectorInstruction(instruction)
  const replaceSpec = parseReplaceInstruction(instruction)
  const insertSpec = parseInsertInstruction(instruction)
  const removeSpec = parseRemoveInstruction(instruction)

  if (!centerSpec && !replaceSpec && !insertSpec && !removeSpec) {
    return {
      ok: false,
      changedFiles: [],
      message: 'Istruzione non supportata. Esempi: "centra il footer", "sostituisci \"A\" con \"B\"", "inserisci \"X\" dopo \"Y\"", "rimuovi \"Z\"", "ripristina modifiche precedenti".'
    }
  }

  const targets = inferTargets(indexData, instruction, targetFile)
  const changedFiles = []
  const snapshotId = new Date().toISOString().replace(/[:.]/g, '-')

  for (const relPath of targets) {
    const absPath = path.join(root, relPath)
    if (!(await fileExists(absPath))) continue

    const raw = await fs.readFile(absPath, 'utf8')

    let next = raw
    let changed = false

    if (centerSpec) {
      const centerResult = updateCssBlockCenter(next, centerSpec.selector)
      next = centerResult.content
      changed = changed || centerResult.changed
    }

    if (replaceSpec) {
      const replaceResult = applyScopedReplace(next, replaceSpec.oldText, replaceSpec.newText, centerSpec?.selector || null)
      next = replaceResult.content
      changed = changed || replaceResult.changed
    }

    if (insertSpec) {
      const insertResult = applyInsert(next, insertSpec, centerSpec?.selector || null)
      next = insertResult.content
      changed = changed || insertResult.changed
    }

    if (removeSpec) {
      const removeResult = applyRemove(next, removeSpec, centerSpec?.selector || null)
      next = removeResult.content
      changed = changed || removeResult.changed
    }

    if (!changed || next === raw) continue

    await backupFile(root, relPath, raw, snapshotId)
    await fs.writeFile(absPath, next, 'utf8')
    changedFiles.push(relPath)

    if (targetFile) break
  }

  if (changedFiles.length === 0) {
    return {
      ok: true,
      changedFiles,
      message: 'Nessuna modifica applicata (scope non trovato o testo gia aggiornato). Prova a indicare il file nel campo opzionale.'
    }
  }

  return {
    ok: true,
    changedFiles,
    message: `Modifica applicata in ${changedFiles.length} file. Backup: .my-agent/backups/${snapshotId}`
  }
}
