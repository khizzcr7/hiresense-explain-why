# Build log - Open Agent Hackathon Track 02 (HireSense Explain-Why)

## Completion run: Sat 24 Oct 2026 ~05:15-06:00 PKT

Turned the scaffold into a submission package. Key realisations from the
official Academy page (updated 23 Oct): every submission must implement at
least one Meterless Engine (H-MEM / Markovian / World Model / Scout Intent)
in a working feature, use Nightshift as primary AI provider with NVIDIA
inside, and name the engine + its test in the sponsor explanation.

- `src/engines/hmem.js` - NEW: working H-MEM engine (working / episodic /
  semantic tiers, consolidation, change deltas). Wired into CLI + both
  demos; reports gained a "Memory (H-MEM engine)" section.
- `src/zetaris.js` - NEW: real Zetaris Lightning gateway client (SQL probe +
  query, env-configured). `UnifiedDataLayer` now routes federation through
  it when configured and stamps the route in the trace; honest local
  fallback otherwise.
- `src/reasoner.js` - the throwing stub is gone: `NightshiftNemotronReasoner`
  is a real Nightshift chat-completions client (cite-or-abstain prompt
  contract, strict-JSON verdicts, request-id attribution) + `createReasoner`
  factory with announced local fallback. LocalReasoner also extracts claims
  from CV summary text now (fixed the missed "Dynamics 365" match).
- Fixtures: `candidate-junior.json` got its own identity + fallback repos
  (it previously borrowed khizzcr7 and inherited his GitHub evidence —
  evidence-leak fixed); added `job-d365.json` + `examples/run-demo-gaps.js`
  (weak-fit demo).
- `test/run.test.js` - NEW: 5 tests, all passing (`npm test`): reasoner
  evidence/gaps, Nightshift contract (mock transport), Zetaris contract
  (mock transport), H-MEM engine change-detection.
- Sample outputs committed: `examples/sample-report.md` / `.json`.
- Docs written: README (rewritten), SPONSOR-TECH.md, PRE-EXISTING.md,
  SLIDES.md (8 points), DEMO-SCRIPT.md (~3 min), SUBMISSION.md (paste-ready
  HackOS fields + checklist), `.env.example`.
- Verified: `npm test` 5/5; demo strong-fit (live GitHub, 9 repos); demo
  re-run shows memory recall; gaps demo weak-fit 20/100 with named gaps;
  CLI markdown + JSON vs both fixture jobs.
- BLOCKERS (organiser-side, unchanged): Nightshift/Meterless access and
  Cursor claim still TBC; Zetaris gateway endpoint/key never issued. No
  keys exist anywhere in the workspace (searched). All three layers are
  config-only switches when access lands.
- Remaining (browser/human): create + upload repo from
  `upload-staging/open-agent/`, convert slides, record video, submit on
  HackOS before Wed 28 Oct 04:45 PKT. See SUBMISSION.md.

Scaffold run: Fri 23 Oct 2026 ~13:10 PKT.

## What was built (all new work since the build window opened)

`~/workspace/small-cash/open-agent-hackathon/build/`:

- `package.json` / `.gitignore` - Node >=18 module scaffold (`hiresense-explain-why`).
- `src/sources.js` - `CvSource`, `GitHubSource` (live GitHub API with graceful
  fallback), `JobDescriptionSource`, and `UnifiedDataLayer` (single semantic
  layer; interface point for Zetaris federation later). All data carries
  source provenance.
- `src/reasoner.js` - `LocalReasoner` (working heuristic: claim extraction,
  evidence matching, per-claim confidence, scoring, reasoning trace) and
  `MeterlessNemotronReasoner` (interface stub; throws by design until the live
  credit is claimable).
- `src/report.js` - Explain-Why markdown + JSON report generator with
  per-claim evidence, confidence badges, gaps, and reasoning trace.
- `src/index.js` - CLI: `explain-why <candidate.json> <job-spec.json> [--json]`.
- `src/fixtures/candidate-demo.json`, `src/fixtures/job-demo.json` - demo data.
- `examples/run-demo.js` - one-command demo; **verified running end to end**:
  fetched cv-pdf + 9 live GitHub repos + job-description and produced a full
  Explain-Why report with per-claim evidence.
- `README.md` - usage, architecture, sponsor-tech status, pre-existing
  components declaration.

## Verification status

- Cursor access: UNCONFIRMED (still TBC from organisers; do not claim until the
  official HackOS step appears).
- Meterless/Nemotron credit: UNCONFIRMED (was unanswered in the 21 Oct workshop;
  stub wired and throws by design).
- Zetaris: account ready since 20 Oct; federated querying NOT yet wired
  (fixtures stand in).
- GitHub check: khizzcr7 has NO existing open-agent / hiresense-explain repo
  (12 repos scanned 23 Oct). Next step: create public repo
  `khizzcr7/hiresense-explain-why` (his GitHub-always rule: new repos go public).

## Remaining to submission (close 28 Oct 04:45 PKT)

1. Create + push public GitHub repo.
2. Wire Zetaris federated query into `UnifiedDataLayer` (or document why not).
3. Swap `MeterlessNemotronReasoner` in if the credit becomes claimable.
4. Memory across sessions (Track 02 bonus narrative).
5. UI polish (Cursor-built if access lands).
6. Demo video (1-4 min), slide deck (8 required points), sponsor-tech
   explanation, pre-existing components declaration, HackOS submission.
