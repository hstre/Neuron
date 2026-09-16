import { createId } from './ids'
import type { Claim, ClaimKind } from './types'

function inferKind(sentence: string): ClaimKind {
  const lower = sentence.toLocaleLowerCase('de')
  if (sentence.endsWith('?')) return 'question'
  if (/\b(könnte|vielleicht|möglicherweise|hypothese)\b/.test(lower)) return 'hypothesis'
  if (/\b(sollte|muss|dürfen|brauchen wir)\b/.test(lower)) return 'norm'
  if (/\b(ich schlage vor|vorschlag|wir bauen)\b/.test(lower)) return 'proposal'
  return 'claim'
}

function normalizeSentence(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function extractClaims(text: string, authorId: string, artifactId = 'workspace'): Claim[] {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(normalizeSentence)
    .filter((sentence) => sentence.length >= 24)

  const unique = [...new Set(sentences)]
  const timestamp = new Date().toISOString()

  return unique.map((sentence, index) => ({
    id: createId('clm'),
    text: sentence,
    kind: inferKind(sentence),
    authorId,
    origin: { artifactId, anchor: `sentence-${index + 1}` },
    status: 'proposed',
    confidence: sentence.endsWith('?') ? 0.5 : 0.72,
    createdAt: timestamp,
  }))
}
