'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const MODELS = ['gemma4:e2b', 'gemma4:e4b', 'gemma4:26b', 'gemma4:31b']

const SYSTEM_HINTS = [
  'Pronto. Digita il tuo messaggio...',
  'Sistema operativo: Gemma4 locale',
  'Connessione a Ollama: localhost:11434',
  'Nessun dato inviato al cloud.',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState('gemma4:e2b')
  const [connected, setConnected] = useState<boolean | null>(null)
  const [hintIndex, setHintIndex] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Check connessione Ollama
  useEffect(() => {
    fetch('/api/chat')
      .then(r => r.ok ? setConnected(true) : setConnected(false))
      .catch(() => setConnected(false))
  }, [])

  // Hint rotante
  useEffect(() => {
    const t = setInterval(() => {
      setHintIndex(i => (i + 1) % SYSTEM_HINTS.length)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  // Scroll bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMsg])

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error('Errore API')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullContent += chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: fullContent,
          }
          return updated
        })
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: '⚠ Errore: impossibile raggiungere Ollama. Assicurati che sia in esecuzione.',
          }
          return updated
        })
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [input, messages, isLoading, model])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const stopGeneration = () => {
    abortRef.current?.abort()
    setIsLoading(false)
  }

  const clearChat = () => {
    if (!isLoading) setMessages([])
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#e2e8f0',
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;600;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 2px; }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes scanline {
          0% { top: -5%; }
          100% { top: 105%; }
        }
        @keyframes typing {
          0%, 60%, 100% { opacity: 0; }
          30% { opacity: 1; }
        }

        .msg-in { animation: fadeIn 0.2s ease-out both; }

        .cursor-blink::after {
          content: '▊';
          animation: blink 1s step-end infinite;
          color: #7c3aed;
          margin-left: 1px;
        }

        .scanline-overlay {
          pointer-events: none;
          position: fixed;
          inset: 0;
          overflow: hidden;
          z-index: 100;
        }
        .scanline-overlay::after {
          content: '';
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(transparent, rgba(124,58,237,0.08), transparent);
          animation: scanline 6s linear infinite;
        }

        .dot-typing span {
          display: inline-block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #7c3aed;
          margin: 0 2px;
          animation: typing 1.2s infinite;
        }
        .dot-typing span:nth-child(2) { animation-delay: 0.2s; }
        .dot-typing span:nth-child(3) { animation-delay: 0.4s; }

        .send-btn:hover { background: #6d28d9 !important; }
        .send-btn:active { transform: scale(0.96); }
        .clear-btn:hover { color: #f87171 !important; border-color: #f87171 !important; }
        .stop-btn:hover { background: #dc2626 !important; }

        .model-select {
          background: #12121c;
          border: 1px solid #2a2a3e;
          color: #a78bfa;
          border-radius: 4px;
          padding: 4px 8px;
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
          outline: none;
        }
        .model-select:focus { border-color: #7c3aed; }

        .msg-user {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border-left: 2px solid #7c3aed;
        }
        .msg-assistant {
          background: #0f0f1a;
          border-left: 2px solid #1e3a5f;
        }

        textarea {
          resize: none;
          overflow: hidden;
          max-height: 160px;
          overflow-y: auto;
        }
        textarea:focus { outline: none; }

        .hint-text {
          transition: opacity 0.5s ease;
        }

        pre {
          background: #0d0d18;
          border: 1px solid #1e1e2e;
          border-radius: 4px;
          padding: 12px;
          overflow-x: auto;
          margin: 8px 0;
          font-size: 12px;
          line-height: 1.6;
        }
        code {
          font-family: inherit;
          color: #a78bfa;
        }
      `}</style>

      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1e1e2e',
        padding: '12px 20px',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>◈</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', fontFamily: '"Syne", sans-serif', letterSpacing: '0.05em' }}>
              LOCAL AI TERMINAL
            </div>
            <div style={{ fontSize: 10, color: '#4a4a6a', letterSpacing: '0.08em' }}>
              OLLAMA · GEMMA4 · OFFLINE
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Stato connessione */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 7, height: 7,
              borderRadius: '50%',
              background: connected === null ? '#6b7280' : connected ? '#10b981' : '#ef4444',
              animation: connected ? 'pulse-dot 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 10, color: '#4a4a6a', letterSpacing: '0.06em' }}>
              {connected === null ? 'VERIFICA...' : connected ? 'OLLAMA OK' : 'OLLAMA OFFLINE'}
            </span>
          </div>

          {/* Selettore modello */}
          <select
            className="model-select"
            value={model}
            onChange={e => setModel(e.target.value)}
          >
            {MODELS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Clear */}
          <button
            className="clear-btn"
            onClick={clearChat}
            disabled={isLoading}
            style={{
              background: 'none',
              border: '1px solid #2a2a3e',
              color: '#4a4a6a',
              borderRadius: 4,
              padding: '4px 10px',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.06em',
              transition: 'all 0.2s',
            }}
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Area messaggi */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            color: '#2a2a3e',
            paddingTop: 60,
          }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>◈</div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#3a3a5e' }}>
              NESSUNA CONVERSAZIONE ATTIVA
            </div>
            <div className="hint-text" style={{ fontSize: 10, color: '#2a2a4e', letterSpacing: '0.08em' }}>
              {SYSTEM_HINTS[hintIndex]}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`msg-in ${msg.role === 'user' ? 'msg-user' : 'msg-assistant'}`}
            style={{
              padding: '14px 16px',
              borderRadius: 4,
              marginBottom: 6,
            }}
          >
            {/* Header messaggio */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}>
              <span style={{
                fontSize: 9,
                letterSpacing: '0.12em',
                color: msg.role === 'user' ? '#7c3aed' : '#3b82f6',
                fontWeight: 600,
              }}>
                {msg.role === 'user' ? '▶ USER' : `◈ ${model.toUpperCase()}`}
              </span>
              <span style={{ fontSize: 9, color: '#2a2a4e' }}>
                {formatTime(msg.timestamp)}
              </span>
            </div>

            {/* Contenuto */}
            <div style={{
              fontSize: 13,
              lineHeight: 1.75,
              color: msg.role === 'user' ? '#c4b5fd' : '#cbd5e1',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
              className={isLoading && i === messages.length - 1 && msg.role === 'assistant' && !msg.content ? 'cursor-blink' : ''}
            >
              {msg.content || (
                isLoading && i === messages.length - 1 && msg.role === 'assistant' ? (
                  <div className="dot-typing">
                    <span /><span /><span />
                  </div>
                ) : ''
              )}
              {isLoading && i === messages.length - 1 && msg.role === 'assistant' && msg.content && (
                <span style={{
                  display: 'inline-block',
                  width: 8, height: 14,
                  background: '#7c3aed',
                  marginLeft: 2,
                  verticalAlign: 'middle',
                  animation: 'blink 0.8s step-end infinite',
                }} />
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid #1e1e2e',
        padding: '16px 20px',
        background: '#0a0a0f',
        position: 'sticky',
        bottom: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          background: '#0f0f1a',
          border: '1px solid #2a2a3e',
          borderRadius: 6,
          padding: '10px 12px',
          transition: 'border-color 0.2s',
        }}
          onFocus={() => {}}
        >
          <span style={{ color: '#7c3aed', fontSize: 12, paddingBottom: 2, flexShrink: 0 }}>▶</span>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio... (Invio per inviare, Shift+Invio per andare a capo)"
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#e2e8f0',
              fontFamily: 'inherit',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          />
          {isLoading ? (
            <button
              className="stop-btn"
              onClick={stopGeneration}
              style={{
                background: '#991b1b',
                border: 'none',
                color: '#fca5a5',
                borderRadius: 4,
                padding: '6px 12px',
                fontSize: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.06em',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              ■ STOP
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{
                background: input.trim() ? '#7c3aed' : '#1e1e2e',
                border: 'none',
                color: input.trim() ? '#fff' : '#3a3a5e',
                borderRadius: 4,
                padding: '6px 14px',
                fontSize: 10,
                cursor: input.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit',
                letterSpacing: '0.06em',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              SEND ▶
            </button>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: '#2a2a3e', letterSpacing: '0.06em', textAlign: 'center' }}>
          100% LOCALE · NESSUN DATO INVIATO AL CLOUD · POWERED BY OLLAMA
        </div>
      </div>
    </div>
  )
}
