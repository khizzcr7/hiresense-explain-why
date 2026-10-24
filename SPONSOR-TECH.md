# Sponsor-technology explanation — HireSense Explain-Why

Open Agent Hackathon 2026 · Track 02 · Solo team "Khizar Solo"

This document explains, per sponsor technology, **what the agent uses, where
it lives in the code, how it is verified, and its honest status** at
submission time.

---

## 1. Zetaris — the Data layer

**Role in the product.** Recruiting data is fragmented by nature: a CV in one
place, public code in another, the job spec in a third. Zetaris is the layer
that federates such sources behind one SQL/semantic interface, and that is
exactly the seat it occupies here: `UnifiedDataLayer` (`src/sources.js`) is
the single access point for all sources, and `ZetarisClient`
(`src/zetaris.js`) routes that federation through a Zetaris Cloud Gateway
when one is configured — the layer probes the gateway with SQL
(`ZetarisClient.probe()` → `SELECT 1`) before routing, and stamps every
evidence snapshot `federatedVia: 'zetaris-lightning'`. The federation route
is printed in every report's reasoning trace, so a judge can see which path
produced the evidence.

**Configuration.** `ZETARIS_GATEWAY_URL`, `ZETARIS_API_KEY`,
`ZETARIS_SQL_PATH` (see `.env.example`). No endpoint or key is hard-coded:
none was published in the public quick-start material.

**Honest status.** The participant's Zetaris Cloud account was created
(organiser email, 20 Oct 2026), but **no gateway/instance endpoint or API key
was ever issued during the event**, so a live gateway call cannot be shown.
In that state the layer degrades to direct local federation and stamps the
trace `federatedVia: 'local'` with the reason — the agent never claims a
Zetaris call it did not make. The client is verified against its contract by
automated tests with a mock transport (`test/run.test.js`: unconfigured
client throws `ZetarisNotConfiguredError`; configured client's probe returns
rows). Source federation itself is live today via the sources' native APIs —
including a **live GitHub API call** in every demo run (9 public repositories
fetched for the demo candidate at build time).

## 2. Meterless Nightshift + NVIDIA Nemotron — the Power layer

**Role in the product.** Nightshift is the agent's primary AI provider and
Nemotron its reasoning model. `NightshiftNemotronReasoner`
(`src/reasoner.js`) sends **one real request per evaluation** through
Nightshift: a Meterless prompt-library style contract — a strict system
prompt ("cite-or-abstain": a requirement is satisfied only with quoted,
source-named evidence; missing evidence must be returned as a gap; strict
JSON output only) plus a compact evidence pack built from the federated
snapshots. The response is parsed defensively (invalid JSON is an error,
never a guessed verdict) and normalised into the same verdict shape the
local backend produces; the model id and the Nightshift request id are
recorded in the reasoning trace.

**Configuration.** `NIGHTSHIFT_API_BASE_URL`, `NIGHTSHIFT_API_KEY`,
`NIGHTSHIFT_MODEL` (the Nemotron model id as listed in the participant's
Nightshift workspace, NVIDIA connected inside Nightshift). Selected
automatically by `createReasoner()` whenever configured.

**Honest status.** Meterless/Nightshift access and credit activation were
**still "to be confirmed" by the organisers throughout the build window**
(the question was raised at the 21 Oct workshop and deferred), and no
Nightshift workspace, base URL, or key was issued to this participant.
The integration is therefore complete and contract-tested — `test/run.test.js`
drives the reasoner against a mock Nightshift transport and verifies the
Nemotron JSON verdict is parsed, scored, and attributed (backend
`meterless-nightshift+nemotron`, request id captured) — but a live
Nightshift call could not be executed without the organiser-issued access.
When no key is present the agent runs its deterministic local heuristic
backend and **announces the fallback in the reasoning trace and on stderr**.

## 3. Meterless Engine — H-MEM (hierarchical memory) — IMPLEMENTED

**Which engine:** **H-MEM**, implemented as a working feature in
`src/engines/hmem.js`, behind the Meterless Engine interface so the hosted
service can replace the local store without touching the agent.

**The feature it powers.** Stateless scorers cannot answer the recruiter's
second question — *"what changed since we last screened this person?"* The
H-MEM engine gives the agent three memory tiers:

- **Working memory** — claims under evaluation in the current run.
- **Episodic memory** — an append-only log of every screening (candidate,
  role, score, verdict, satisfied/missing requirements, timestamp).
- **Semantic memory** — facts consolidated from episodes: per-candidate
  evidence strengths (requirement → times evidenced, last confidence) and
  recurring gaps.

On every run the agent recalls before it reasons and consolidates after it
verdicts. The report's **"Memory (H-MEM engine)"** section then shows the
previous verdict and date, the score delta, newly evidenced requirements,
newly missing requirements, repeated gaps, and the candidate's strongest
accumulated evidence (see `examples/sample-report.md`, captured from a real
second run).

**The test that shows it works.** `npm test` →
`test/run.test.js` → *"H-MEM engine: remembers an evaluation and explains
the change"*: it screens a candidate (score 50), re-screens them after their
CV gains Kubernetes evidence, and asserts from the engine itself —
previous score 50, **delta +50**, `newlySatisfied: ['Kubernetes']`, two
episodes recalled, semantic fact recorded — and that the rendered report
contains the Memory section naming the newly evidenced skill. The same
behaviour is visible live by running `node examples/run-demo.js` twice.

**Honest status.** The engine is a local implementation of the H-MEM
pattern/interface (JSON-file store, `HMEM_PATH`), for the same reason as
§2: the hosted Meterless engine service was never activated for this
participant. What is claimed here is what is true: a working H-MEM engine
feature, tested, in the product — not a hosted-service call that never
happened.

## 4. Cursor — the Build layer

The project was developed in an AI-assisted, Cursor-first workflow
(scaffold, engine implementations, and tests were pair-built with an AI
coding agent in the editor), consistent with the event's "generated code is
allowed and expected" rule. Cursor sponsor credits/access instructions were
listed as "to be confirmed" on HackOS for the duration of the build window;
no credit was claimable, so no Cursor-specific claim beyond the workflow is
made.

---

## Status summary

| Sponsor tech | In code | Verified by | Live call at submission |
|---|---|---|---|
| Zetaris Lightning (data) | `src/zetaris.js`, `UnifiedDataLayer` routing + provenance stamps | Unit tests (mock transport); live GitHub source federation | No — gateway endpoint/key never issued by organisers |
| Meterless Nightshift + NVIDIA Nemotron (power) | `NightshiftNemotronReasoner`, cite-or-abstain prompt contract | Unit tests (mock transport, request-id attribution) | No — Nightshift access never activated for this participant |
| Meterless H-MEM engine | `src/engines/hmem.js` (working feature) | Dedicated engine test + double-run demo | Local implementation of the engine interface (hosted service not activated) |
| Cursor (build) | AI-assisted development workflow | Repo history / build log | n/a |
