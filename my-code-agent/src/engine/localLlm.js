const OLLAMA_URL = process.env.MYAGENT_OLLAMA_URL || 'http://127.0.0.1:11434/api/generate'
const OLLAMA_MODEL = process.env.MYAGENT_LOCAL_MODEL || 'qwen2.5-coder:3b'

export async function generateWithLocalLlm(prompt) {
  let res
  try {
    res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.1
        }
      })
    })
  } catch (err) {
    throw new Error(`Impossibile raggiungere LLM locale su ${OLLAMA_URL}. Avvia Ollama con 'ollama serve' e verifica il modello '${OLLAMA_MODEL}'.`)
  }

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`LLM locale non disponibile (${res.status}): ${txt}`)
  }

  const data = await res.json()
  if (!data.response) throw new Error('Risposta LLM locale vuota')
  return data.response
}

export function extractJsonObject(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Impossibile estrarre JSON dalla risposta modello')
  }
  const raw = text.slice(start, end + 1)
  return JSON.parse(raw)
}
