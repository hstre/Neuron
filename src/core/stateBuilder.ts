import { createId } from './ids'
import type { Claim, SnapshotDiff, StateSnapshot } from './types'

function canonicalClaims(claims: Claim[]): string {
  return claims
    .filter((claim) => claim.status === 'accepted')
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(({ id, text, kind, authorId, origin }) => JSON.stringify({ id, text, kind, authorId, origin }))
    .join('\n')
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function buildSnapshot(
  claims: Claim[],
  mergedBy: string,
  previous?: StateSnapshot,
): Promise<StateSnapshot> {
  const accepted = claims.filter((claim) => claim.status === 'accepted')
  return {
    id: createId('state'),
    version: (previous?.version ?? 0) + 1,
    claimIds: accepted.map((claim) => claim.id).sort(),
    digest: await sha256(canonicalClaims(accepted)),
    createdAt: new Date().toISOString(),
    mergedBy,
  }
}

export function diffSnapshots(
  previous: StateSnapshot | undefined,
  current: StateSnapshot | undefined,
  claims: Claim[],
): SnapshotDiff {
  const previousIds = new Set(previous?.claimIds ?? [])
  const currentIds = new Set(current?.claimIds ?? [])
  return {
    added: claims.filter((claim) => currentIds.has(claim.id) && !previousIds.has(claim.id)),
    removed: claims.filter((claim) => previousIds.has(claim.id) && !currentIds.has(claim.id)),
  }
}
