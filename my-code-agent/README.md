# My Code Agent

MVP personale per esplorare una codebase con:
- CLI (`index`, `ask`, `tool:*`)
- Tool filesystem (`list_dir`, `read_file`, `search`, `summarize_module`)
- API HTTP locale
- UI web minimale

## Quickstart

```bash
cd /Users/jacoposantarelli/Desktop/ClaudeCode/my-code-agent
npm run index
node src/cli.js ask "come e' strutturato questo progetto?"
node src/cli.js plan "aggiungi endpoint export csv"
node src/cli.js apply "centra il footer"
node src/cli.js apply "ripristina modifiche precedenti" . velvet-beauty-studio.html
node src/cli.js agent-preview "rendi il footer piu elegante" . velvet-beauty-studio.html
node src/cli.js agent-apply . velvet-beauty-studio.html
node src/cli.js agent-undo . velvet-beauty-studio.html
npm run serve
npm run ui
```

API: `http://localhost:8787`
UI: `http://localhost:4173`

## Comandi CLI

```bash
node src/cli.js index <root>
node src/cli.js ask "domanda" [root]
node src/cli.js plan "feature request" [root]
node src/cli.js apply "istruzione modifica" [root] [file]
node src/cli.js agent "richiesta libera" [root] [file]
node src/cli.js agent-preview "richiesta libera" [root] [file]
node src/cli.js agent-apply [instruction] [root] [file]
node src/cli.js agent-undo [root] [file]
node src/cli.js tool:list_dir <dir>
node src/cli.js tool:read_file <file>
node src/cli.js tool:search "query" [root]
node src/cli.js tool:summarize_module <file>
```

## Architettura

- `src/cli.js`: entrypoint CLI
- `src/engine/`: retrieval + risposta
- `src/tools/`: tool locali
- `src/server/api.js`: API JSON
- `src/server/ui.js`: static web server
- `web/`: frontend semplice

## Note

- Nessuna dipendenza esterna: gira con Node.js standard.
- Il motore `ask` usa euristiche locali (non LLM).
- Le risposte `ask` includono riferimenti `file:linea`.
- `apply` esegue modifiche reali ai file con backup in `.my-agent/backups`.
- Esempi: `apply "centra il footer"`, `apply "sostituisci \"A\" con \"B\""` e `apply "ripristina modifiche precedenti"` (facoltativo `file` per limitare lo scope).
- `agent-preview` genera una proposta con diff senza scrivere.
- `agent-apply` applica la preview salvata, oppure genera+applica se passi una nuova instruction tramite `agent`.
- `agent-undo` ripristina dal backup piu recente.
- `agent` usa una LLM locale via Ollama (`MYAGENT_LOCAL_MODEL`, default `qwen2.5-coder:3b`) ed e un alias rapido di apply con richiesta libera.
- L'indice viene salvato in `.my-agent/index.json` nella root analizzata.

## LLM Locale (Ollama)

```bash
# 1) installa ollama (una volta)
# 2) scarica un modello leggero coding
ollama pull qwen2.5-coder:3b

# 3) avvia ollama (se non gia attivo)
ollama serve

# 4) opzionale: modello diverso
export MYAGENT_LOCAL_MODEL=qwen2.5-coder:7b
```
