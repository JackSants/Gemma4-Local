#!/usr/bin/env node
import path from 'node:path'
import { resolveRoot, listFilesRecursive, fileMeta } from './lib/fsUtils.js'
import { saveIndex, loadIndex } from './lib/indexStore.js'
import { answerQuestion } from './engine/answer.js'
import { buildPlan } from './engine/plan.js'
import { applyInstruction } from './engine/apply.js'
import { previewAgentEdit, applyAgentEdit, applyPreview, undoAgentEdit } from './engine/agent.js'
import { listDir } from './tools/listDir.js'
import { readFileTool } from './tools/readFile.js'
import { searchTool } from './tools/search.js'
import { summarizeModule } from './tools/summarizeModule.js'

async function runIndex(rootArg) {
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
  console.log(`Index creato: ${out}`)
  console.log(`File indicizzati: ${indexData.fileCount}`)
}

async function runAsk(question, rootArg) {
  const root = resolveRoot(rootArg || '.')
  const indexData = await loadIndex(root)
  const answer = await answerQuestion(root, indexData, question)
  console.log(answer.text)
}

async function runPlan(featureRequest, rootArg) {
  const root = resolveRoot(rootArg || '.')
  const indexData = await loadIndex(root)
  const plan = buildPlan(indexData, featureRequest)
  console.log(plan.text)
}

async function runApply(instruction, rootArg, targetFileArg) {
  const root = resolveRoot(rootArg || '.')
  const indexData = await loadIndex(root)
  const result = await applyInstruction(root, indexData, instruction, targetFileArg || null)
  console.log(result.message)
  if (result.changedFiles.length > 0) {
    console.log('File modificati:')
    for (const file of result.changedFiles) {
      console.log(`- ${file}`)
    }
  }
}

function printAgentResult(result) {
  console.log(result.message)
  if (result.summary) console.log(`Summary: ${result.summary}`)
  if (result.file) console.log(`File: ${result.file}`)
  if (result.diff) {
    console.log('Diff:')
    console.log(result.diff)
  }
  if (result.changedFiles.length > 0) {
    console.log('File modificati:')
    for (const file of result.changedFiles) {
      console.log(`- ${file}`)
    }
  }
}

async function runAgentPreview(instruction, rootArg, targetFileArg) {
  const root = resolveRoot(rootArg || '.')
  const indexData = await loadIndex(root)
  const result = await previewAgentEdit(root, indexData, instruction, targetFileArg || null)
  printAgentResult(result)
}

async function runAgentApply(instruction, rootArg, targetFileArg) {
  const root = resolveRoot(rootArg || '.')
  const indexData = await loadIndex(root)
  const result = instruction
    ? await applyAgentEdit(root, indexData, instruction, targetFileArg || null)
    : await applyPreview(root)
  printAgentResult(result)
}

async function runAgentUndo(rootArg, targetFileArg) {
  const root = resolveRoot(rootArg || '.')
  const result = await undoAgentEdit(root, targetFileArg || null)
  printAgentResult(result)
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2)

  if (!cmd) {
    console.log('Uso: node src/cli.js <index|ask|plan|apply|agent|agent-preview|agent-apply|agent-undo|tool:list_dir|tool:read_file|tool:search|tool:summarize_module>')
    process.exit(0)
  }

  try {
    switch (cmd) {
      case 'index': {
        await runIndex(args[0])
        break
      }
      case 'ask': {
        const question = args[0]
        const rootArg = args[1]
        if (!question) throw new Error('Manca la domanda. Esempio: node src/cli.js ask "struttura progetto" .')
        await runAsk(question, rootArg)
        break
      }
      case 'plan': {
        const featureRequest = args[0]
        const rootArg = args[1]
        if (!featureRequest) throw new Error('Manca la feature. Esempio: node src/cli.js plan "aggiungi endpoint export csv" .')
        await runPlan(featureRequest, rootArg)
        break
      }
      case 'apply': {
        const instruction = args[0]
        const rootArg = args[1]
        const targetFileArg = args[2]
        if (!instruction) throw new Error('Manca l istruzione. Esempio: node src/cli.js apply "centra footer" .')
        await runApply(instruction, rootArg, targetFileArg)
        break
      }
      case 'agent': {
        const instruction = args[0]
        const rootArg = args[1]
        const targetFileArg = args[2]
        if (!instruction) throw new Error('Manca l istruzione. Esempio: node src/cli.js agent "rendi il footer piu moderno" .')
        await runAgentApply(instruction, rootArg, targetFileArg)
        break
      }
      case 'agent-preview': {
        const instruction = args[0]
        const rootArg = args[1]
        const targetFileArg = args[2]
        if (!instruction) throw new Error('Manca l istruzione. Esempio: node src/cli.js agent-preview "rendi il footer piu moderno" .')
        await runAgentPreview(instruction, rootArg, targetFileArg)
        break
      }
      case 'agent-apply': {
        const instruction = args[0]
        const rootArg = args[1]
        const targetFileArg = args[2]
        await runAgentApply(instruction || null, rootArg, targetFileArg)
        break
      }
      case 'agent-undo': {
        const rootArg = args[0]
        const targetFileArg = args[1]
        await runAgentUndo(rootArg, targetFileArg)
        break
      }
      case 'tool:list_dir': {
        const root = resolveRoot(args[1] || '.')
        const dir = args[0] || '.'
        console.log(JSON.stringify(await listDir(root, dir), null, 2))
        break
      }
      case 'tool:read_file': {
        const root = resolveRoot(args[1] || '.')
        const file = args[0]
        if (!file) throw new Error('Manca il path file')
        console.log(await readFileTool(root, file))
        break
      }
      case 'tool:search': {
        const query = args[0]
        const root = resolveRoot(args[1] || '.')
        if (!query) throw new Error('Manca query')
        const results = await searchTool(root, query)
        console.log(results.join('\n'))
        break
      }
      case 'tool:summarize_module': {
        const file = args[0]
        const root = resolveRoot(args[1] || '.')
        if (!file) throw new Error('Manca file')
        console.log(JSON.stringify(await summarizeModule(root, file), null, 2))
        break
      }
      default:
        throw new Error(`Comando non riconosciuto: ${cmd}`)
    }
  } catch (err) {
    console.error(`Errore: ${err.message}`)
    process.exit(1)
  }
}

main()
