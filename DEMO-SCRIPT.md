# Demo video script — HireSense Explain-Why (target 3:00, allowed 1:00–4:00)

Format: screen recording of a real terminal + the generated report, with
voiceover (or captions). Everything shown is a real run of the committed
code. Timings are guides; total must stay under 4:00.

**Before recording**
- Fresh terminal, large font. Working directory: the repo root.
- Delete any local memory file first (`rm -f .explain-why-memory.json`) so
  Beat 1 is a genuine first screening.
- **Keys/tokens**: if Nightshift/Zetaris are configured in your shell, do
  NOT show the `.env` file or any command that echoes a key. The runs below
  never print keys.
- If organiser-issued Nightshift access has landed by recording day, Beat 1
  automatically becomes the required "one real request through Meterless
  Nightshift" shot — the stderr line names the Nemotron model and the
  trace records the request id. If it has not, record as scripted: the
  fallback line is part of the honesty story, say it out loud (line marked
  †). Do not fake a Nightshift screen.

| Time | Shot | Action / command | Narration |
|---|---|---|---|
| 0:00–0:20 | Title card → terminal | Show repo README top, then terminal | "Hiring AI gives recruiters a score and no reasons. This is HireSense Explain-Why — an agent that investigates a candidate across their CV, their public code, and the job spec, and then explains every claim it makes. Track 02: the agent that can explain why." |
| 0:20–1:05 | **Beat 1 — strong fit** | Run `node examples/run-demo.js`. Let stderr lines appear ("Sources fetched…", federation note), then scroll the report slowly. | "One command. The agent federates three fragmented sources — CV data, the candidate's live public GitHub, fetched just now, and the job description. The verdict: strong fit, 100 out of 100. But look at the form: every requirement carries its evidence and its source. REST APIs is high confidence because two independent sources agree. Nothing is asserted without a citation — that's the cite-or-abstain rule." |
| 1:05–1:45 | **Beat 2 — explain why NOT** | Run `node examples/run-demo-gaps.js`. Pause on the gaps list. | "Now the harder test: a junior candidate, same job. A normal scorer would quietly rank them last. This agent says weak fit, 20 out of 100 — and names exactly what's missing: no React evidence, no Node, no Postgres. That's an interview plan and an honest answer to 'why not me?', not just a rejection." |
| 1:45–2:25 | **Beat 3 — memory (H-MEM)** | Run `node examples/run-demo.js` a second time. Highlight the "Memory (H-MEM engine)" section. | "Here's the Meterless engine we implemented: H-MEM, hierarchical memory. The agent remembers the first screening — same candidate, same role — and reports the delta: score unchanged, and the evidence base strengthening, now evidenced twice. Re-screen someone after three months of learning and this section is where their growth shows up." |
| 2:25–2:50 | Code + tests | Open `src/engines/hmem.js` briefly, then run `npm test` and let the 5 green checks land. | "The engine is proven, not promised: the test suite screens a candidate, watches them gain a skill, and asserts the agent reports exactly that change. The sponsor layers — Zetaris federation, Nightshift with NVIDIA Nemotron — sit behind the same interfaces…" |
| 2:50–3:10 | Closing card | Show SPONSOR-TECH.md status table + README judging map. | †"…and where organiser access never switched on during the event, the agent says so in its own trace. An agent that explains itself, including its limits. HireSense Explain-Why — every score, with its reasons. Thank you." |

**Cut list if running long**: drop the code shot in Beat 4 (keep the test
run), tighten Beat 1 scrolling. Do not cut Beat 2 — the honest-gaps case is
half the thesis.

**Accessibility**: burn in captions or upload a caption file; the narration
above is the caption text.
