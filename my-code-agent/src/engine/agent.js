import fs from 'node:fs/promises'
import path from 'node:path'
import { generateWithLocalLlm, extractJsonObject } from './localLlm.js'
import { restoreFromBackup } from './apply.js'

function tokenizeInstruction(instruction) {
  return instruction
    .toLowerCase()
    .replace(/[^a-z0-9_\-/ ]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

function inferTargetFile(indexData, instruction, targetFile = null) {
  if (targetFile) return targetFile

  const files = indexData.files
    .filter((f) => !f.skipped)
    .map((f) => f.path)
    .filter((p) => p.endsWith('.html') || p.endsWith('.css') || p.endsWith('.js') || p.endsWith('.ts') || p.endsWith('.tsx'))

  if (files.length === 0) throw new Error('Nessun file modificabile trovato nell index')
  if (files.length === 1) return files[0]

  const q = instruction.toLowerCase()
  const tokens = tokenizeInstruction(instruction)
  const scored = files
    .map((file) => {
      const p = file.toLowerCase()
      let score = 0
      for (const t of tokens) if (p.includes(t)) score += 2
      if ((q.includes('footer') || q.includes('header') || q.includes('nav')) && (p.endsWith('.html') || p.endsWith('.css'))) score += 3
      if (p.endsWith('.html')) score += 1
      if (p.endsWith('.css')) score += 1
      return { file, score }
    })
    .sort((a, b) => b.score - a.score || a.file.length - b.file.length)

  return scored[0].file
}

async function backupBeforeWrite(root, relPath, original) {
  const snapshotId = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(root, '.my-agent', 'backups', snapshotId, relPath)
  await fs.mkdir(path.dirname(backupPath), { recursive: true })
  await fs.writeFile(backupPath, original, 'utf8')
  return snapshotId
}

async function savePreview(root, preview) {
  const previewPath = path.join(root, '.my-agent', 'agent-preview.json')
  await fs.mkdir(path.dirname(previewPath), { recursive: true })
  await fs.writeFile(previewPath, JSON.stringify(preview, null, 2), 'utf8')
  return previewPath
}

export async function loadPreview(root) {
  const previewPath = path.join(root, '.my-agent', 'agent-preview.json')
  const raw = await fs.readFile(previewPath, 'utf8')
  return JSON.parse(raw)
}

function buildPrompt(instruction, relPath, currentContent) {
  return [
    'Sei un agente di code editing.',
    'Devi modificare SOLO il file indicato rispettando la richiesta utente.',
    'Non cambiare parti non necessarie.',
    'Conserva il piu possibile struttura, indentazione e stile esistenti.',
    'Rispondi SOLO con JSON valido nel formato:',
    '{"updated_content":"...","summary":"..."}',
    '',
    `Richiesta utente: ${instruction}`,
    `File target: ${relPath}`,
    '',
    'Contenuto attuale file:',
    '```',
    currentContent,
    '```'
  ].join('\n')
}

function createDiff(original, updated, relPath) {
  const before = original.split('\n')
  const after = updated.split('\n')
  const maxLen = Math.max(before.length, after.length)
  const lines = [`--- ${relPath}`, `+++ ${relPath}`]

  for (let i = 0; i < maxLen; i += 1) {
    const a = before[i]
    const b = after[i]
    if (a === b) continue
    if (a !== undefined) lines.push(`- ${i + 1}: ${a}`)
    if (b !== undefined) lines.push(`+ ${i + 1}: ${b}`)
    if (lines.length > 120) {
      lines.push('... diff troncato ...')
      break
    }
  }

  if (lines.length === 2) {
    lines.push('Nessuna differenza rilevata.')
  }

  return lines.join('\n')
}

export async function previewAgentEdit(root, indexData, instruction, targetFile = null) {
  const relPath = inferTargetFile(indexData, instruction, targetFile)
  const absPath = path.join(root, relPath)
  const original = await fs.readFile(absPath, 'utf8')

  const prompt = buildPrompt(instruction, relPath, original)
  const modelRaw = await generateWithLocalLlm(prompt)
  const payload = extractJsonObject(modelRaw)

  if (!payload.updated_content || typeof payload.updated_content !== 'string') {
    throw new Error('La LLM non ha restituito updated_content valido')
  }

  const preview = {
    instruction,
    file: relPath,
    summary: payload.summary || '',
    original,
    updatedContent: payload.updated_content,
    diff: createDiff(original, payload.updated_content, relPath),
    createdAt: new Date().toISOString()
  }

  await savePreview(root, preview)

  return {
    ok: true,
    changedFiles: preview.updatedContent === original ? [] : [relPath],
    message: preview.updatedContent === original
      ? 'Preview generata ma il modello non propone modifiche.'
      : `Preview generata per ${relPath}.`,
    summary: preview.summary,
    diff: preview.diff,
    file: relPath
  }
}

export async function applyAgentEdit(root, indexData, instruction, targetFile = null) {
  const preview = await previewAgentEdit(root, indexData, instruction, targetFile)
  if (preview.changedFiles.length === 0) {
    return preview
  }

  const stored = await loadPreview(root)
  const absPath = path.join(root, stored.file)
  const snapshotId = await backupBeforeWrite(root, stored.file, stored.original)
  await fs.writeFile(absPath, stored.updatedContent, 'utf8')

  return {
    ok: true,
    changedFiles: [stored.file],
    message: `Modifica agente applicata su ${stored.file}. Backup: .my-agent/backups/${snapshotId}`,
    summary: stored.summary,
    diff: stored.diff,
    file: stored.file
  }
}

export async function applyPreview(root) {
  const stored = await loadPreview(root)
  if (stored.updatedContent === stored.original) {
    return {
      ok: true,
      changedFiles: [],
      message: 'La preview salvata non contiene modifiche da applicare.',
      summary: stored.summary || '',
      diff: stored.diff || '',
      file: stored.file
    }
  }

  const absPath = path.join(root, stored.file)
  const current = await fs.readFile(absPath, 'utf8')
  const snapshotId = await backupBeforeWrite(root, stored.file, current)
  await fs.writeFile(absPath, stored.updatedContent, 'utf8')

  return {
    ok: true,
    changedFiles: [stored.file],
    message: `Preview applicata su ${stored.file}. Backup: .my-agent/backups/${snapshotId}`,
    summary: stored.summary || '',
    diff: stored.diff || '',
    file: stored.file
  }
}

export async function undoAgentEdit(root, targetFile = null) {
  return restoreFromBackup(root, targetFile)
}
