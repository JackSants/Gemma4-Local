import path from 'node:path'
import { readFileTool } from './readFile.js'

export async function summarizeModule(root, filePath) {
  const content = await readFileTool(root, filePath)
  const lines = content.split('\n')

  const exportLines = lines.filter((l) => l.includes('export ')).slice(0, 12)
  const importLines = lines.filter((l) => l.startsWith('import ')).slice(0, 12)

  return {
    file: path.normalize(filePath),
    lineCount: lines.length,
    imports: importLines,
    exports: exportLines,
    preview: lines.slice(0, 25).join('\n')
  }
}
