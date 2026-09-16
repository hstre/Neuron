import { extractClaims } from './claimExtractor'
import { falsifyClaim } from './falsifier'
import type { Claim, Review } from './types'

export interface ContextAssembly {
  task: 'extract' | 'falsify'
  artifactId: string
  actorId: string
}

export interface ModelAdapter {
  readonly id: string
  extract(text: string, context: ContextAssembly): Promise<Claim[]>
  falsify(claim: Claim, context: ContextAssembly): Promise<Review>
}

/**
 * A deterministic adapter keeps the protocol usable and testable without
 * transmitting data or configuring an external model provider.
 */
export class DeterministicDemoAdapter implements ModelAdapter {
  readonly id = 'deterministic-demo-v1'

  async extract(text: string, context: ContextAssembly): Promise<Claim[]> {
    return extractClaims(text, context.actorId, context.artifactId)
  }

  async falsify(claim: Claim, context: ContextAssembly): Promise<Review> {
    return falsifyClaim(claim, context.actorId)
  }
}
