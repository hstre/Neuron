import { useEffect, useMemo, useRef, useState } from 'react'
import { createId } from './core/ids'
import { DeterministicDemoAdapter } from './core/modelAdapter'
import { buildSnapshot, diffSnapshots } from './core/stateBuilder'
import type { ClaimStatus, ProjectState } from './core/types'
import { clearProject, downloadProject, loadProject, parseProject, saveProject } from './core/vault'
import { createDemoProject, demoText } from './data/demo'

type View = 'workspace' | 'state' | 'about'

const statusLabels: Record<ClaimStatus, string> = {
  proposed: 'Vorschlag',
  under_review: 'In Prüfung',
  accepted: 'Akzeptiert',
  rejected: 'Verworfen',
  superseded: 'Ersetzt',
  unresolved: 'Offen',
}

const modelAdapter = new DeterministicDemoAdapter()

function App() {
  const [project, setProject] = useState<ProjectState>(() => loadProject(createDemoProject()))
  const [view, setView] = useState<View>('workspace')
  const [notice, setNotice] = useState('Lokaler Vault · keine Cloud-Synchronisierung')
  const importInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    saveProject(project)
  }, [project])

  const latest = project.snapshots.at(-1)
  const previous = project.snapshots.at(-2)
  const diff = useMemo(() => diffSnapshots(previous, latest, project.claims), [previous, latest, project.claims])
  const pending = project.claims.filter((claim) => claim.status === 'proposed' || claim.status === 'under_review')
  const accepted = project.claims.filter((claim) => claim.status === 'accepted')

  function updateProject(change: Partial<ProjectState>) {
    setProject((current) => ({ ...current, ...change, updatedAt: new Date().toISOString() }))
  }

  async function handleExtract() {
    const extracted = await modelAdapter.extract(project.sourceText, {
      task: 'extract',
      artifactId: 'workspace',
      actorId: 'actor_extractor',
    })
    updateProject({ claims: extracted, reviews: [], decisions: [], snapshots: [] })
    setNotice(`${extracted.length} Claims extrahiert · noch nichts ist bestätigt`)
  }

  async function handleReview(claimId: string) {
    const claim = project.claims.find((item) => item.id === claimId)
    if (!claim) return
    const existing = project.reviews.filter((review) => review.claimId !== claimId)
    updateProject({
      claims: project.claims.map((item) => item.id === claimId ? { ...item, status: 'under_review' } : item),
      reviews: [...existing, await modelAdapter.falsify(claim, {
        task: 'falsify',
        artifactId: claim.origin.artifactId,
        actorId: 'actor_critic',
      })],
    })
    setNotice('Gegenprüfung erstellt · Entscheidung bleibt beim Menschen')
  }

  function decide(claimId: string, status: 'accepted' | 'rejected') {
    updateProject({
      claims: project.claims.map((claim) => claim.id === claimId ? { ...claim, status } : claim),
      decisions: [
        ...project.decisions,
        { id: createId('decision'), claimId, decidedBy: 'actor_human', outcome: status, createdAt: new Date().toISOString() },
      ],
    })
    setNotice(status === 'accepted' ? 'Claim akzeptiert · State noch nicht gemergt' : 'Claim verworfen · Begründung bleibt erhalten')
  }

  async function handleMerge() {
    const snapshot = await buildSnapshot(project.claims, 'actor_human', latest)
    if (latest?.digest === snapshot.digest) {
      setNotice('Keine Änderung am bestätigten State')
      return
    }
    updateProject({ snapshots: [...project.snapshots, snapshot] })
    setNotice(`State v${snapshot.version} erzeugt · ${snapshot.digest.slice(0, 10)}…`)
    setView('state')
  }

  function resetDemo() {
    clearProject()
    setProject(createDemoProject())
    setView('workspace')
    setNotice('Demonstration zurückgesetzt')
  }

  async function importVault(file: File | undefined) {
    if (!file) return
    try {
      const imported = parseProject(await file.text(), createDemoProject())
      setProject(imported)
      setNotice(`Vault „${imported.title}“ importiert`)
      setView('workspace')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Import fehlgeschlagen')
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <div><strong>Neuron</strong><small>epistemic workspace</small></div>
        </div>

        <nav aria-label="Hauptnavigation">
          <button className={view === 'workspace' ? 'active' : ''} onClick={() => setView('workspace')}>
            <span>◫</span> Arbeitsraum <b>{pending.length}</b>
          </button>
          <button className={view === 'state' ? 'active' : ''} onClick={() => setView('state')}>
            <span>◇</span> Bestätigter State <b>{accepted.length}</b>
          </button>
          <button className={view === 'about' ? 'active' : ''} onClick={() => setView('about')}>
            <span>○</span> Über Neuron
          </button>
        </nav>

        <div className="vault-card">
          <span className="eyebrow">Vault</span>
          <strong>Dieses Gerät</strong>
          <small>{project.claims.length} Claims · {project.snapshots.length} States</small>
          <button className="text-button" onClick={() => downloadProject(project)}>Vault exportieren</button>
          <button className="text-button" onClick={() => importInput.current?.click()}>Vault importieren</button>
          <input
            ref={importInput}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void importVault(event.target.files?.[0])}
          />
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">Projekt</span>
            <h1>{project.title}</h1>
          </div>
          <div className="top-actions">
            <span className="notice">{notice}</span>
            <button className="secondary" onClick={resetDemo}>Zurücksetzen</button>
            <button className="primary" onClick={handleMerge} disabled={accepted.length === 0}>State mergen</button>
          </div>
        </header>

        {view === 'workspace' && (
          <section className="workspace-grid">
            <article className="panel editor-panel">
              <div className="panel-heading">
                <div><span className="eyebrow">Artifact · Mensch</span><h2>Arbeitsnotiz</h2></div>
                <button className="secondary compact" onClick={() => updateProject({ sourceText: demoText })}>Beispiel</button>
              </div>
              <textarea
                aria-label="Arbeitsnotiz"
                value={project.sourceText}
                onChange={(event) => updateProject({ sourceText: event.target.value })}
                placeholder="Gedanken, Quellen oder Dialog hier einfügen …"
              />
              <div className="editor-footer">
                <span>{project.sourceText.length} Zeichen</span>
                <button className="primary" onClick={() => void handleExtract()} disabled={project.sourceText.trim().length < 24}>Claims extrahieren</button>
              </div>
            </article>

            <article className="panel claims-panel">
              <div className="panel-heading">
                <div><span className="eyebrow">Review Queue</span><h2>Claims</h2></div>
                <span className="count">{project.claims.length}</span>
              </div>

              {project.claims.length === 0 ? (
                <div className="empty-state"><span>◇</span><h3>Noch keine Claims</h3><p>Extrahiere prüfbare Aussagen aus der Arbeitsnotiz. Sie werden nicht automatisch Teil des States.</p></div>
              ) : (
                <div className="claim-list">
                  {project.claims.map((claim, index) => {
                    const review = project.reviews.find((item) => item.claimId === claim.id)
                    return (
                      <section className={`claim-card status-${claim.status}`} key={claim.id}>
                        <div className="claim-meta">
                          <span>CLM-{String(index + 1).padStart(2, '0')}</span>
                          <span className="pill">{claim.kind}</span>
                          <span className={`status ${claim.status}`}>{statusLabels[claim.status]}</span>
                        </div>
                        <p>{claim.text}</p>
                        {review && (
                          <div className="review-box">
                            <strong>Chain of Falsification</strong>
                            <p>{review.note}</p>
                            <ul>
                              <li><b>Voraussetzung:</b> {review.assumptions[0]}</li>
                              <li><b>Widerlegung:</b> {review.falsifiers[0]}</li>
                              <li><b>Alternative:</b> {review.alternatives[0]}</li>
                            </ul>
                          </div>
                        )}
                        <div className="claim-actions">
                          <button className="secondary compact" onClick={() => void handleReview(claim.id)}>Gegenprüfen</button>
                          <span />
                          <button className="reject compact" onClick={() => decide(claim.id, 'rejected')}>Verwerfen</button>
                          <button className="accept compact" onClick={() => decide(claim.id, 'accepted')}>Akzeptieren</button>
                        </div>
                      </section>
                    )
                  })}
                </div>
              )}
            </article>
          </section>
        )}

        {view === 'state' && (
          <section className="state-layout">
            <article className="panel state-panel">
              <div className="panel-heading">
                <div><span className="eyebrow">Bestätigter Arbeitsstand</span><h2>{latest ? `State v${latest.version}` : 'Noch kein State'}</h2></div>
                {latest && <code>{latest.digest.slice(0, 12)}</code>}
              </div>
              {!latest ? (
                <div className="empty-state"><span>◇</span><h3>Der State ist leer</h3><p>Akzeptiere Claims im Arbeitsraum und führe anschließend einen bewussten Merge aus.</p></div>
              ) : (
                <ol className="state-claims">
                  {latest.claimIds.map((id) => <li key={id}>{project.claims.find((claim) => claim.id === id)?.text}</li>)}
                </ol>
              )}
            </article>
            <aside className="panel diff-panel">
              <span className="eyebrow">Diff zum Vorgänger</span>
              <h2>Veränderung</h2>
              <div className="diff-group added"><strong>+ {diff.added.length} hinzugefügt</strong>{diff.added.map((claim) => <p key={claim.id}>{claim.text}</p>)}</div>
              <div className="diff-group removed"><strong>− {diff.removed.length} entfernt</strong>{diff.removed.map((claim) => <p key={claim.id}>{claim.text}</p>)}</div>
              {latest && <small>Gemergt durch Mensch<br />{new Date(latest.createdAt).toLocaleString('de-DE')}</small>}
            </aside>
          </section>
        )}

        {view === 'about' && (
          <section className="panel prose">
            <span className="eyebrow">Entwicklungsprojekt</span>
            <h2>Neuron ist nicht The Synapse.</h2>
            <p>Neuron ist ein kleiner, lokaler Prototyp, der die epistemische Kopplung getrennter Akteure nachvollziehbar macht. Das System behauptet weder ein gemeinsames Subjekt noch autonome Mündigkeit.</p>
            <p>Dialog, Modellvorschläge und bestätigter State bleiben getrennt. Ein Modell kann extrahieren, widersprechen und Alternativen anbieten. Nur der Mensch kann einen Vorschlag in den verbindlichen Arbeitsstand mergen.</p>
            <div className="principles"><span>Lokale Hoheit</span><span>Offene Provenienz</span><span>Widerspruch vor Konsens</span><span>Menschlicher Merge</span></div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
