import { createId } from './ids'
import type { Claim, Review } from './types'

export function falsifyClaim(claim: Claim, reviewerId: string): Review {
  const lower = claim.text.toLocaleLowerCase('de')
  const assumptions: string[] = []
  const falsifiers: string[] = []
  const alternatives: string[] = []

  if (/\b(immer|nie|alle|keine|zwangsläufig|automatisch)\b/.test(lower)) {
    assumptions.push('Die Aussage verwendet einen starken oder universellen Quantor.')
    falsifiers.push('Ein belastbares Gegenbeispiel würde die universelle Form widerlegen.')
  }

  if (/\b(dadurch|deshalb|führt zu|erzeugt|bewirkt)\b/.test(lower)) {
    assumptions.push('Ein kausaler Zusammenhang wird angenommen.')
    alternatives.push('Beide Beobachtungen könnten eine gemeinsame dritte Ursache haben.')
  }

  if (/\b(sollte|muss|dürfen|verantwort)\b/.test(lower)) {
    assumptions.push('Die Aussage enthält einen normativen Maßstab, der offengelegt werden sollte.')
    falsifiers.push('Zu prüfen ist, ob der Maßstab konsistent auf vergleichbare Fälle angewandt wird.')
  }

  if (/\b(intelligenz|perspektiv|weisheit|moral)\b/.test(lower)) {
    alternatives.push('Fähigkeit, Motivation und normative Gewichtung könnten voneinander unabhängig sein.')
  }

  if (assumptions.length === 0) assumptions.push('Die zentralen Voraussetzungen sind im Text noch nicht explizit benannt.')
  if (falsifiers.length === 0) falsifiers.push('Eine Quelle oder Beobachtung suchen, die das Gegenteil erwarten lässt.')
  if (alternatives.length === 0) alternatives.push('Eine konkurrierende Erklärung mit denselben beobachtbaren Folgen formulieren.')

  const needsEvidence = claim.kind === 'hypothesis' || assumptions.length > 1 || claim.confidence < 0.8

  return {
    id: createId('rev'),
    claimId: claim.id,
    reviewerId,
    verdict: needsEvidence ? 'needs-evidence' : 'plausible',
    assumptions,
    falsifiers,
    alternatives,
    note: needsEvidence
      ? 'Der Claim ist denkbar, aber noch nicht ausreichend begründet.'
      : 'Der Claim ist sprachlich plausibel; die Gegenprüfung bleibt offen.',
    createdAt: new Date().toISOString(),
  }
}
