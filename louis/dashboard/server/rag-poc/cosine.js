export function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

// Returns the top-K corpus entries by cosine similarity to queryVector, each
// annotated with its score, sorted descending.
export function topKBySimilarity(queryVector, corpusWithVectors, k) {
  return corpusWithVectors
    .map(entry => ({ ...entry, score: cosineSim(queryVector, entry.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}
