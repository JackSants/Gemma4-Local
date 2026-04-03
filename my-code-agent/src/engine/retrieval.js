const STOPWORDS = new Set([
  'come', 'faccio', 'questo', 'quello', 'della', 'delle', 'degli', 'dello',
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'where', 'why'
])

export function tokenize(question) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9_\-/ ]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
}

export function selectRelevantFiles(indexData, question, topK = 6) {
  const tokens = tokenize(question)
  const scored = indexData.files
    .filter((f) => !f.skipped)
    .map((f) => {
      const p = f.path.toLowerCase()
      const score = tokens.reduce((acc, t) => {
        if (!p.includes(t)) return acc
        if (p.endsWith(`${t}.js`) || p.endsWith(`${t}.ts`)) return acc + 3
        if (p.includes(`/engine/`) || p.includes(`/tools/`) || p.includes(`/server/`)) return acc + 2
        return acc + 1
      }, 0)
      return { ...f, score }
    })
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score || a.path.length - b.path.length)

  if (scored.length === 0) {
    return indexData.files
      .filter((f) => !f.skipped)
      .slice(0, topK)
  }

  return scored.slice(0, topK)
}
