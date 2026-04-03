import { selectRelevantFiles } from './retrieval.js'

function inferAction(pathname) {
  const p = pathname.toLowerCase()
  if (p.includes('/web/') || p.endsWith('.html') || p.endsWith('.css')) return 'Aggiornare UI e interazione utente'
  if (p.endsWith('/server/ui.js')) return 'Aggiornare server statico della UI'
  if (p.endsWith('/server/api.js') || p.includes('/api')) return 'Aggiornare endpoint/contratti API'
  if (p.includes('/tools/')) return 'Estendere tool di supporto'
  if (p.includes('/engine/')) return 'Aggiornare logica di retrieval/risposta'
  if (p.includes('readme') || p.includes('architecture') || p.includes('roadmap')) return 'Allineare documentazione'
  return 'Valutare modifiche implementative'
}

function scorePlanTarget(pathname, featureRequest) {
  const p = pathname.toLowerCase()
  const q = featureRequest.toLowerCase()
  let score = 0

  if (p.includes('.my-agent/')) score -= 100
  if (p.includes('readme') || p.includes('roadmap') || p.includes('architecture')) score -= 2

  if (q.includes('endpoint') || q.includes('api') || q.includes('route')) {
    if (p.includes('/server/') || p.includes('/api')) score += 6
  }
  if (q.includes('ui') || q.includes('interfaccia') || q.includes('frontend') || q.includes('bottone')) {
    if (p.includes('/web/') || p.endsWith('.html') || p.endsWith('.css')) score += 6
  }
  if (q.includes('tool') || q.includes('command') || q.includes('comando')) {
    if (p.includes('/tools/') || p.endsWith('/cli.js')) score += 6
  }
  if (q.includes('retrieval') || q.includes('risposta') || q.includes('ranking')) {
    if (p.includes('/engine/')) score += 6
  }
  if (q.includes('test')) {
    if (p.includes('test')) score += 5
  }

  if (p.includes('/server/') || p.includes('/tools/') || p.includes('/engine/')) score += 2
  if (p.endsWith('.js') || p.endsWith('.ts')) score += 1

  return score
}

export function buildPlan(indexData, featureRequest) {
  const relevant = selectRelevantFiles(indexData, featureRequest, 30)
    .map((f) => ({ ...f, planScore: scorePlanTarget(f.path, featureRequest) }))
    .filter((f) => f.planScore > -50)
    .sort((a, b) => b.planScore - a.planScore || a.path.length - b.path.length)

  const targets = relevant.slice(0, 5).map((f) => ({
    file: f.path,
    reason: inferAction(f.path)
  }))

  const steps = [
    `Analizzare requisiti: "${featureRequest}" e confermare vincoli`,
    `Implementare modifiche in ${targets.length} file candidati`,
    'Validare con test manuali (CLI/API/UI) e aggiornare documentazione'
  ]

  const planText = [
    `Feature: ${featureRequest}`,
    '',
    'File consigliati da toccare:',
    ...targets.map((t) => `- ${t.file}: ${t.reason}`),
    '',
    'Piano operativo:',
    ...steps.map((s, i) => `${i + 1}. ${s}`)
  ].join('\n')

  return {
    feature: featureRequest,
    targets,
    steps,
    text: planText
  }
}
