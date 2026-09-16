import type { ProjectState } from '../core/types'

export const demoText = `Mehr Intelligenz könnte einer KI erlauben, sehr viel mehr menschliche Perspektiven gleichzeitig zu verstehen. Daraus folgt jedoch nicht automatisch, dass sie diesen Perspektiven einen moralischen Wert beimisst. Eine verantwortungsfähige KI sollte deshalb ihre normativen Maßstäbe offenlegen und begründeten Widerspruch ermöglichen.`

export function createDemoProject(): ProjectState {
  return {
    title: 'Perspektivenintegration und Urteilskraft',
    sourceText: demoText,
    actors: [
      { id: 'actor_human', type: 'human', displayName: 'Mensch' },
      { id: 'actor_extractor', type: 'llm', displayName: 'Extractor' },
      { id: 'actor_critic', type: 'llm', displayName: 'Falsifier' },
    ],
    claims: [],
    reviews: [],
    decisions: [],
    snapshots: [],
    updatedAt: new Date().toISOString(),
  }
}
