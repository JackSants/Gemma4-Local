import http from 'node:http'
import { DEFAULT_API_PORT } from '../config.js'
import { resolveRoot, listFilesRecursive, fileMeta } from '../lib/fsUtils.js'
import { saveIndex, loadIndex } from '../lib/indexStore.js'
import { answerQuestion } from '../engine/answer.js'
import { buildPlan } from '../engine/plan.js'
import { applyInstruction } from '../engine/apply.js'
import { previewAgentEdit, applyAgentEdit, applyPreview, undoAgentEdit } from '../engine/agent.js'

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  res.end(JSON.stringify(payload, null, 2))
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk.toString()
    })
    req.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (e) {
        reject(new Error('JSON non valido'))
      }
    })
    req.on('error', reject)
  })
}

async function handleIndex(rootArg) {
  const root = resolveRoot(rootArg || '.')
  const files = await listFilesRecursive(root)
  const metas = []
  for (const f of files) {
    metas.push(await fileMeta(f, root))
  }
  const indexData = {
    root,
    createdAt: new Date().toISOString(),
    fileCount: metas.length,
    files: metas
  }
  const out = await saveIndex(root, indexData)
  return { root, fileCount: metas.length, indexPath: out }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendJson(res, 200, { ok: true })
      return
    }

    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, { ok: true, service: 'my-code-agent-api' })
      return
    }

    if (req.method === 'POST' && req.url === '/index') {
      const body = await parseBody(req)
      const data = await handleIndex(body.root)
      sendJson(res, 200, { ok: true, ...data })
      return
    }

    if (req.method === 'POST' && req.url === '/ask') {
      const body = await parseBody(req)
      if (!body.question) {
        sendJson(res, 400, { ok: false, error: 'Campo question richiesto' })
        return
      }
      const root = resolveRoot(body.root || '.')
      const indexData = await loadIndex(root)
      const answer = await answerQuestion(root, indexData, body.question)
      sendJson(res, 200, { ok: true, ...answer })
      return
    }

    if (req.method === 'POST' && req.url === '/plan') {
      const body = await parseBody(req)
      if (!body.feature) {
        sendJson(res, 400, { ok: false, error: 'Campo feature richiesto' })
        return
      }
      const root = resolveRoot(body.root || '.')
      const indexData = await loadIndex(root)
      const plan = buildPlan(indexData, body.feature)
      sendJson(res, 200, { ok: true, ...plan })
      return
    }

    if (req.method === 'POST' && req.url === '/apply') {
      const body = await parseBody(req)
      if (!body.instruction) {
        sendJson(res, 400, { ok: false, error: 'Campo instruction richiesto' })
        return
      }
      const root = resolveRoot(body.root || '.')
      const indexData = await loadIndex(root)
      const result = await applyInstruction(root, indexData, body.instruction, body.file || null)
      sendJson(res, 200, result)
      return
    }

    if (req.method === 'POST' && req.url === '/agent/preview') {
      const body = await parseBody(req)
      if (!body.instruction) {
        sendJson(res, 400, { ok: false, error: 'Campo instruction richiesto' })
        return
      }
      const root = resolveRoot(body.root || '.')
      const indexData = await loadIndex(root)
      const result = await previewAgentEdit(root, indexData, body.instruction, body.file || null)
      sendJson(res, 200, result)
      return
    }

    if (req.method === 'POST' && req.url === '/agent/apply') {
      const body = await parseBody(req)
      const root = resolveRoot(body.root || '.')
      const indexData = await loadIndex(root)
      const result = body.instruction
        ? await applyAgentEdit(root, indexData, body.instruction, body.file || null)
        : await applyPreview(root)
      sendJson(res, 200, result)
      return
    }

    if (req.method === 'POST' && req.url === '/agent/undo') {
      const body = await parseBody(req)
      const root = resolveRoot(body.root || '.')
      const result = await undoAgentEdit(root, body.file || null)
      sendJson(res, 200, result)
      return
    }

    sendJson(res, 404, { ok: false, error: 'Not found' })
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message })
  }
})

server.listen(DEFAULT_API_PORT, '127.0.0.1', () => {
  console.log(`API pronta su http://127.0.0.1:${DEFAULT_API_PORT}`)
})
