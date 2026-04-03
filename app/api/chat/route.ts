import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e2b'

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Ollama error: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Stream la risposta al client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(Boolean)
            for (const line of lines) {
              try {
                const data = JSON.parse(line)
                const content = data.message?.content || ''
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content))
                }
                if (data.done) {
                  controller.close()
                  return
                }
              } catch {}
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Errore connessione a Ollama' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Ollama non raggiungibile' }, { status: 503 })
  }
}
