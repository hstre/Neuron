import { describe, expect, it } from 'vitest'
import { extractClaims } from './claimExtractor'
import { falsifyClaim } from './falsifier'
import { buildSnapshot, diffSnapshots } from './stateBuilder'

describe('epistemic core', () => {
  it('extracts distinct claims with provenance', () => {
    const claims = extractClaims(
      'Intelligenz erzeugt nicht automatisch Moral. Eine KI sollte ihre Maßstäbe offenlegen.',
      'actor_llm',
      'artifact_1',
    )
    expect(claims).toHaveLength(2)
    expect(claims[0].origin.artifactId).toBe('artifact_1')
    expect(claims[1].kind).toBe('norm')
  })

  it('flags a leap from intelligence to morality', () => {
    const [claim] = extractClaims('Mehr Intelligenz erzeugt automatisch moralische Weisheit.', 'actor_llm')
    const review = falsifyClaim(claim, 'actor_critic')
    expect(review.assumptions.join(' ')).toContain('universellen Quantor')
    expect(review.alternatives.join(' ')).toContain('normative Gewichtung')
  })

  it('builds a deterministic digest and an auditable diff', async () => {
    const claims = extractClaims('Eine bestätigte Aussage bleibt auf ihren Ursprung zurückführbar.', 'actor_llm')
      .map((claim) => ({ ...claim, status: 'accepted' as const }))
    const first = await buildSnapshot(claims, 'actor_human')
    const repeated = await buildSnapshot(claims, 'actor_human')
    expect(first.digest).toBe(repeated.digest)
    expect(diffSnapshots(undefined, first, claims).added).toHaveLength(1)
  })
})
