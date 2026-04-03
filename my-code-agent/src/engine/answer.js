import { readFileTool } from '../tools/readFile.js'
import { selectRelevantFiles, tokenize } from './retrieval.js'

function findCitations(filePath, content, tokens, maxPerFile = 2) {
  const lines = content.split('\n')
  const citations = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const normalized = line.toLowerCase()
    const hasMatch = tokens.some((t) => normalized.includes(t))
    if (!hasMatch) continue

    citations.push({
      file: filePath,
      line: i + 1,
      text: line.trim().slice(0, 140)
    })

    if (citations.length >= maxPerFile) break
  }

  if (citations.length === 0 && lines.length > 0) {
    citations.push({
      file: filePath,
      line: 1,
      text: lines[0].trim().slice(0, 140)
    })
  }

  return citations
}

function buildSnippet(filePath, content, tokens) {
  const lines = content.split('\n')
  let startLine = 1

  for (let i = 0; i < lines.length; i += 1) {
    const normalized = lines[i].toLowerCase()
    if (tokens.some((t) => normalized.includes(t))) {
      startLine = i + 1
      break
    }
  }

  const startIndex = Math.max(0, startLine - 1)
  const snippetLines = lines.slice(startIndex, startIndex + 18)

  return {
    file: filePath,
    line: startLine,
    text: snippetLines.join('\n').slice(0, 700)
  }
}

export async function answerQuestion(root, indexData, question) {
  const relevant = selectRelevantFiles(indexData, question)
  const tokens = tokenize(question)

  const snippets = []
  const citations = []
  for (const file of relevant.slice(0, 5)) {
    const content = await readFileTool(root, file.path)
    snippets.push(buildSnippet(file.path, content, tokens))
    citations.push(...findCitations(file.path, content, tokens))
  }

  const summaryLines = [
    `Domanda: ${question}`,
    '',
    'File piu rilevanti:',
    ...relevant.slice(0, 5).map((f) => `- ${f.path}`),
    '',
    'Riferimenti (file:linea):',
    ...citations.slice(0, 10).map((c) => `- ${c.file}:${c.line} ${c.text ? `- ${c.text}` : ''}`),
    '',
    'Estratti:',
    ...snippets.map((s) => `\n[${s.file}:${s.line}]\n${s.text}`)
  ]

  return {
    files: relevant.slice(0, 5).map((f) => f.path),
    citations: citations.slice(0, 10),
    text: summaryLines.join('\n')
  }
}
