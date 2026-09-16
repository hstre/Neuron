export type ActorType = 'human' | 'llm' | 'source' | 'system'
export type ClaimKind = 'observation' | 'claim' | 'hypothesis' | 'question' | 'proposal' | 'norm' | 'decision'
export type ClaimStatus = 'proposed' | 'under_review' | 'accepted' | 'rejected' | 'superseded' | 'unresolved'
export type ReviewVerdict = 'plausible' | 'needs-evidence' | 'contradicted' | 'unclear'

export interface Actor {
  id: string
  type: ActorType
  displayName: string
}

export interface Origin {
  artifactId: string
  anchor: string
}

export interface Claim {
  id: string
  text: string
  kind: ClaimKind
  authorId: string
  origin: Origin
  status: ClaimStatus
  confidence: number
  createdAt: string
}

export interface Review {
  id: string
  claimId: string
  reviewerId: string
  verdict: ReviewVerdict
  assumptions: string[]
  falsifiers: string[]
  alternatives: string[]
  note: string
  createdAt: string
}

export interface Decision {
  id: string
  claimId: string
  decidedBy: string
  outcome: 'accepted' | 'rejected'
  createdAt: string
}

export interface StateSnapshot {
  id: string
  version: number
  claimIds: string[]
  digest: string
  createdAt: string
  mergedBy: string
}

export interface ProjectState {
  title: string
  sourceText: string
  actors: Actor[]
  claims: Claim[]
  reviews: Review[]
  decisions: Decision[]
  snapshots: StateSnapshot[]
  updatedAt: string
}

export interface SnapshotDiff {
  added: Claim[]
  removed: Claim[]
}
