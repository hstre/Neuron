# Neuron

**A local-first epistemic workspace for accountable human–LLM collaboration.**

Neuron is the small development project beneath the broader concept of **The Synapse**. It does not claim to create a shared persistent subject or Layer 9. Its job is more concrete: preserve how separate human and artificial actors arrive at a justified working state.

## What the prototype already demonstrates

1. Write or paste a working note.
2. Extract individually reviewable claims with provenance.
3. Run a separate Chain of Falsification.
4. Let the human accept or reject each proposal.
5. Merge accepted claims into a versioned StateSnapshot.
6. Inspect the diff and deterministic SHA-256 digest.

The model-facing steps currently use a deterministic `ModelAdapter`. This keeps the epistemic protocol testable before any provider API or secret is added.

## Principles

- Separate actors remain separate.
- Dialogue, proposals and accepted state are different layers.
- A model may propose and criticise, but cannot silently merge.
- Provenance matters more than eloquence.
- The user owns, exports and deletes the vault.
- Deterministic rules govern identity, status and state changes.

## Run locally

```bash
npm install
npm run dev
```

Tests and production build:

```bash
npm test
npm run build
```

## Current status

`v0.1` is a vertical prototype, not a production knowledge system. The next technical step is the first external `ModelAdapter` with explicit, logged context assemblies, followed by source anchoring and Git-backed vault synchronisation.

## Name hierarchy

- **Neuron** — this concrete development project
- **The Synapse** — the theoretical model of coupling between separate epistemic actors
- **Layer 9** — a possible future social and technical infrastructure

## License

MIT
