const API = 'http://127.0.0.1:8787'

const rootEl = document.getElementById('root')
const questionEl = document.getElementById('question')
const featureEl = document.getElementById('feature')
const instructionEl = document.getElementById('instruction')
const applyFileEl = document.getElementById('applyFile')
const agentInstructionEl = document.getElementById('agentInstruction')
const agentFileEl = document.getElementById('agentFile')
const indexOut = document.getElementById('indexOut')
const askOut = document.getElementById('askOut')
const planOut = document.getElementById('planOut')
const applyOut = document.getElementById('applyOut')
const agentOut = document.getElementById('agentOut')
const agentDiff = document.getElementById('agentDiff')

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.json()
}

function formatAgentResult(data) {
  const lines = [data.message || 'Operazione completata.']
  if (data.summary) lines.push(`Summary: ${data.summary}`)
  if (data.file) lines.push(`File: ${data.file}`)
  if (data.diff) {
    lines.push('')
    lines.push('Diff:')
    lines.push(data.diff)
  }
  if (Array.isArray(data.changedFiles) && data.changedFiles.length > 0) {
    lines.push('')
    lines.push('File modificati:')
    for (const file of data.changedFiles) lines.push(`- ${file}`)
  }
  if (data.ok === false || data.error) {
    lines.unshift('Errore:')
    if (data.error) lines.push(`Dettaglio: ${data.error}`)
  }
  return lines.join('\n')
}

function renderAgentDiff(diff) {
  if (!diff) {
    agentDiff.hidden = true
    agentDiff.innerHTML = ''
    return
  }

  const html = diff
    .split('\n')
    .map((line) => {
      let klass = 'note'
      if (line.startsWith('+++') || line.startsWith('---')) klass = 'meta'
      else if (line.startsWith('+ ')) klass = 'add'
      else if (line.startsWith('- ')) klass = 'remove'

      const safe = line
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')

      return `<div class="diff-line ${klass}">${safe}</div>`
    })
    .join('')

  agentDiff.innerHTML = html
  agentDiff.hidden = false
}

document.getElementById('indexBtn').addEventListener('click', async () => {
  indexOut.textContent = 'Indicizzazione in corso...'
  const data = await post('/index', { root: rootEl.value || '.' })
  indexOut.textContent = JSON.stringify(data, null, 2)
})

document.getElementById('askBtn').addEventListener('click', async () => {
  askOut.textContent = 'Elaborazione...'
  const data = await post('/ask', {
    root: rootEl.value || '.',
    question: questionEl.value
  })
  askOut.textContent = data.text || JSON.stringify(data, null, 2)
})

document.getElementById('planBtn').addEventListener('click', async () => {
  planOut.textContent = 'Generazione piano...'
  const data = await post('/plan', {
    root: rootEl.value || '.',
    feature: featureEl.value
  })
  planOut.textContent = data.text || JSON.stringify(data, null, 2)
})

document.getElementById('applyBtn').addEventListener('click', async () => {
  applyOut.textContent = 'Applicazione modifica...'
  const data = await post('/apply', {
    root: rootEl.value || '.',
    instruction: instructionEl.value,
    file: applyFileEl.value || null
  })
  const lines = [data.message || 'Operazione completata.']
  if (Array.isArray(data.changedFiles) && data.changedFiles.length > 0) {
    lines.push('')
    lines.push('File modificati:')
    for (const file of data.changedFiles) lines.push(`- ${file}`)
  }
  if (data.ok === false) {
    lines.unshift('Errore:')
  }
  applyOut.textContent = lines.join('\n')
})

document.getElementById('agentPreviewBtn').addEventListener('click', async () => {
  agentOut.textContent = 'Generazione preview agent...'
  renderAgentDiff('')
  const data = await post('/agent/preview', {
    root: rootEl.value || '.',
    instruction: agentInstructionEl.value,
    file: agentFileEl.value || null
  })
  agentOut.textContent = formatAgentResult(data)
  renderAgentDiff(data.diff || '')
})

document.getElementById('agentApplyBtn').addEventListener('click', async () => {
  agentOut.textContent = 'Applicazione preview agent...'
  renderAgentDiff('')
  const data = await post('/agent/apply', {
    root: rootEl.value || '.',
    file: agentFileEl.value || null
  })
  agentOut.textContent = formatAgentResult(data)
  renderAgentDiff(data.diff || '')
})

document.getElementById('agentUndoBtn').addEventListener('click', async () => {
  agentOut.textContent = 'Ripristino backup agent...'
  renderAgentDiff('')
  const data = await post('/agent/undo', {
    root: rootEl.value || '.',
    file: agentFileEl.value || null
  })
  agentOut.textContent = formatAgentResult(data)
  renderAgentDiff(data.diff || '')
})
