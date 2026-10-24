# HireSense Explain-Why

**Open Agent Hackathon 2026 — Track 02: The Agent That Can Explain Why**
Solo team **"Khizar Solo"** · Built 22–27 Oct 2026 · Submissions close 27 Oct 2026, 23:45 UTC

Hiring tools already give recruiters a score. What they never give is the
*reasoning*: which evidence produced that score, how strong it is, and what is
missing. **HireSense Explain-Why** is an agent that investigates a candidate
across fragmented sources — their CV, their public code, and the job
description — and produces an **evidence-backed hiring recommendation** in
which *every claim cites its source*, carries a confidence level, and names
its gaps honestly. Ask it about the same candidate twice and its **H-MEM
memory engine** answers the follow-up question too: *what changed since last
time?*

It is an extension of **HireSense**, a pre-existing AI recruitment tool
(resume scanning, candidate–job matching and rating). Everything in this
repository is the new Explain-Why layer built for this hackathon; see
[PRE-EXISTING.md](PRE-EXISTING.md) for the full declaration.

## Quick start

Requirements: **Node.js ≥ 18**. Zero npm dependencies — the agent is pure
Node standard library.

```bash
# 1. The demo (strong-fit case). Run it twice: the second run shows the
#    H-MEM memory section recalling the first screening.
node examples/run-demo.js

# 2. The "explain why NOT" demo (weak-fit case, honest gaps)
node examples/run-demo-gaps.js

# 3. Tests — including the H-MEM engine test cited in SPONSOR-TECH.md
npm test

# 4. Screen your own candidate against your own job
node src/index.js <candidate.json> <job.json> [--json] [--backend auto|local] [--no-memory]
```

Candidate/job files are small JSON documents; see `src/fixtures/` for the
schema (a candidate carries `name`, `summary`, `skills`, `githubUsername`;
a job carries `title`, `requirements`, `niceToHave`). Sample output from a
real run is in `examples/sample-report.md` / `examples/sample-report.json`.

## Sponsor configuration (optional locally, primary in production)

The agent runs end to end with **no keys** so anyone can try it — but its
production configuration is the sponsor stack, selected automatically when
configured (copy `.env.example` to `.env`):

| Layer | Sponsor tech | Config |
|---|---|---|
| Data | **Zetaris Lightning** federated query layer | `ZETARIS_GATEWAY_URL`, `ZETARIS_API_KEY` |
| Power | **Meterless Nightshift** as primary AI provider, **NVIDIA Nemotron** as the reasoning model | `NIGHTSHIFT_API_BASE_URL`, `NIGHTSHIFT_API_KEY`, `NIGHTSHIFT_MODEL` |
| Engine | **Meterless H-MEM** memory pattern (hierarchical memory) | `HMEM_PATH` (local store) |
| Build | Developed with AI coding assistance (**Cursor**-first workflow) | — |

When a layer is not configured, the agent degrades to a local implementation
of the same interface and **says so in its reasoning trace** — it never
pretends a sponsor call happened. Full details, including exactly what is
live vs. pending organiser-issued access: [SPONSOR-TECH.md](SPONSOR-TECH.md).

## How it works

```
candidate.json ─┐
GitHub API ─────┼─► UnifiedDataLayer ─► Reasoner ─► H-MEM ─► Explain-Why report
job.json ───────┘   (Zetaris-routed)    (Nightshift +    (recall /
                                         Nemotron, or     consolidate)
                                         local fallback)
```

1. **Fragmented sources** (`src/sources.js`) — `CvSource` (CV data),
   `GitHubSource` (live public GitHub API, graceful fallback to fixture data
   when the API is unreachable), `JobDescriptionSource` (the role). Every
   snapshot carries source provenance from birth.
2. **Unified data layer** (`src/sources.js`, `src/zetaris.js`) — one
   interface over all sources. When a Zetaris Cloud Gateway is configured,
   federation is routed through Zetaris Lightning (gateway probe first);
   otherwise it federates locally and stamps the trace accordingly.
3. **Reasoning** (`src/reasoner.js`) — a *cite-or-abstain* contract: a
   requirement is "satisfied" only with concrete evidence, quoted with its
   source; missing evidence becomes a named gap, never an invention.
   Confidence is high when two independent sources agree, medium for one,
   low for indirect support. The primary backend sends one request per
   evaluation through **Meterless Nightshift** to an **NVIDIA Nemotron**
   model and parses its strict-JSON verdicts into the same output shape; the
   deterministic local heuristic backend guarantees the agent always runs.
4. **H-MEM memory engine** (`src/engines/hmem.js`) — the implemented
   Meterless Engine. Three tiers: *working* memory (this run's claims),
   *episodic* memory (every past screening), *semantic* memory (consolidated
   per-candidate evidence strengths and recurring gaps). Each evaluation is
   consolidated, so re-screening a candidate produces a delta report:
   previous verdict, score change, newly evidenced skills, repeated gaps.
5. **Report** (`src/report.js`) — recruiter-facing Markdown (or JSON):
   verdict, score, per-requirement evidence and gaps, the reasoning trace,
   and the H-MEM memory section.

## Repository layout

```
src/index.js            CLI entry point
src/sources.js          Fragmented sources + unified data layer
src/zetaris.js          Zetaris Lightning gateway client
src/reasoner.js         Nightshift+Nemotron reasoner, local reasoner, factory
src/engines/hmem.js     H-MEM hierarchical memory engine
src/report.js           Explain-Why report generator (Markdown + JSON)
src/fixtures/           Demo candidates and jobs
examples/run-demo.js        Strong-fit demo
examples/run-demo-gaps.js   Weak-fit ("explain why NOT") demo
examples/sample-report.*    Captured output of a real run
test/run.test.js        Engine + integration tests (node --test)
SPONSOR-TECH.md         Sponsor-technology explanation (submission doc)
PRE-EXISTING.md         Declaration of pre-existing components (submission doc)
SLIDES.md               Slide deck content — the 8 required points
DEMO-SCRIPT.md          Demo video script (1–4 min)
SUBMISSION.md           HackOS submission form, pre-filled + checklist
```

## Judging map

- **Impact (30)** — screening is a high-stakes, high-volume decision made on
  unexplained scores today; cited, auditable reasoning is what makes an AI
  recommendation a recruiter (and a candidate) can trust and challenge.
- **Technical (20)** — fragmented-source federation, a cite-or-abstain
  reasoning contract, a three-tier memory engine, graceful degradation at
  every layer, zero-dependency Node, tests for every engine.
- **Innovation (15)** — explanations as a first-class artifact: per-claim
  provenance, confidence from source agreement, and *longitudinal*
  explanations (what changed since last screening) via memory.
- **Demo (15)** — one command; strong-fit and weak-fit cases; the second run
  remembers the first.
- **Product UX (10)** — the report is the interface: verdict first, evidence
  under every claim, gaps in plain sight, machine-readable JSON twin.
- **Sponsor Tech (10)** — Zetaris data layer, Meterless Nightshift +
  NVIDIA Nemotron power layer, Meterless H-MEM engine, honest status of
  each: [SPONSOR-TECH.md](SPONSOR-TECH.md).

## License

MIT
