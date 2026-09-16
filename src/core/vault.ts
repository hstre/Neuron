import type { ProjectState } from './types'

const STORAGE_KEY = 'neuron:v0.1:project'

export function loadProject(fallback: ProjectState): ProjectState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<ProjectState>
    return {
      ...fallback,
      ...parsed,
      actors: parsed.actors ?? fallback.actors,
      claims: parsed.claims ?? [],
      reviews: parsed.reviews ?? [],
      decisions: parsed.decisions ?? [],
      snapshots: parsed.snapshots ?? [],
    }
  } catch {
    return fallback
  }
}

export function parseProject(raw: string, fallback: ProjectState): ProjectState {
  const parsed = JSON.parse(raw) as Partial<ProjectState>
  if (typeof parsed.title !== 'string' || typeof parsed.sourceText !== 'string') {
    throw new Error('Die Datei ist kein gültiger Neuron-Vault.')
  }
  return {
    ...fallback,
    ...parsed,
    actors: Array.isArray(parsed.actors) ? parsed.actors : fallback.actors,
    claims: Array.isArray(parsed.claims) ? parsed.claims : [],
    reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
  }
}

export function saveProject(project: ProjectState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}

export function clearProject(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function downloadProject(project: ProjectState): void {
  const data = JSON.stringify(project, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = `neuron-vault-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(href)
}
