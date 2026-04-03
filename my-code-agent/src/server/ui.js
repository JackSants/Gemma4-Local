import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_UI_PORT } from '../config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '../../web')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
}

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url === '/' ? '/index.html' : req.url
    const filePath = path.join(root, url)
    const content = await fs.readFile(filePath)
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain; charset=utf-8' })
    res.end(content)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
  }
})

server.listen(DEFAULT_UI_PORT, '127.0.0.1', () => {
  console.log(`UI pronta su http://127.0.0.1:${DEFAULT_UI_PORT}`)
})
