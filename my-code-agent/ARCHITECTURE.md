# Architecture

## Flusso principale
1. `index`: scandisce file e salva metadata in `.my-agent/index.json`
2. `ask`: tokenizza domanda, calcola score sui path indicizzati, legge file top-k
3. `answer`: produce risposta sintetica + riferimenti ai file

## Moduli
- `lib/fsUtils.js`: utility file system e sicurezza path
- `lib/indexStore.js`: persistenza indice
- `tools/*`: operazioni primitive sulla codebase
- `engine/retrieval.js`: scelta file rilevanti
- `engine/answer.js`: sintesi euristica
- `server/api.js`: endpoint `/index` e `/ask`
- `server/ui.js`: serve `web/`

## Sicurezza base
- Path risolti in assoluto
- Accesso limitato alla root richiesta
- Directory rumorose escluse (`node_modules`, `.git`, `.next`, ecc.)
