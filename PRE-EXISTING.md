# Declaration of pre-existing components

Open Agent Hackathon 2026 · Track 02 · Solo team "Khizar Solo" (Muhammad Khizar)
Build window: 22 Oct 2026 00:00 UTC → 27 Oct 2026 23:45 UTC.
**Rule applied: anything built before 22 Oct 2026 00:00 UTC is declared here.**

## Pre-existing (built before the build window)

| Component | What it is | How this submission uses it |
|---|---|---|
| **HireSense** (base product) | The participant's pre-existing AI recruitment tool: resume scanning, candidate–job matching and rating (Next.js front end, Node/Express back end, Gemini-based scoring). Built before this hackathon as a personal project. | This submission is an **extension** of it: the Explain-Why layer answers the question the base product leaves open — *why* a candidate scored as they did. The base app itself is **not** part of this repository and is not submitted. |
| **Demo candidate profile data** (`src/fixtures/candidate-demo.json`) | A skills/summary profile derived from the participant's own real profile and HireSense test data (React, Node.js, Dynamics 365 / Power Platform, etc.). | Used as demo input only. |
| **Public GitHub data** | The participant's public repositories, fetched live via the GitHub API during demo runs. | Used as the live "public code" evidence source. Public data, fetched at run time; nothing vendored into the repo. |
| **General knowledge from a separate hackathon project** | The participant is separately building a HireSense variant for the NVIDIA × Nebius hackathon (different repo, different stack wiring: Token Factory / Nebius). | **Not** reused here. No code from that project is in this repository; this Explain-Why build is a distinct implementation written for this event (Zetaris data layer, Meterless Nightshift power layer, H-MEM engine). The two submissions share only the underlying pre-existing HireSense concept declared above. |

## Built during the build window (new work, all in this repository)

- Explain-Why engine: fragmented-source federation (`src/sources.js`),
  Zetaris Lightning client and routing (`src/zetaris.js`).
- Reasoning backends: Meterless Nightshift + NVIDIA Nemotron reasoner with
  the cite-or-abstain prompt contract, and the deterministic local
  heuristic reasoner (`src/reasoner.js`).
- **H-MEM memory engine** (`src/engines/hmem.js`) — working, episodic and
  semantic memory tiers with consolidation and change reporting.
- Report generator (Markdown + JSON) with per-claim provenance, confidence
  and gaps (`src/report.js`); CLI (`src/index.js`).
- Demo programs, fixtures for the weak-fit case, sample outputs, and the
  automated test suite (`examples/`, `src/fixtures/`, `test/`).
- All submission documents: `README.md`, `SPONSOR-TECH.md`, this
  declaration, `SLIDES.md`, `DEMO-SCRIPT.md`, `SUBMISSION.md`.

## Third-party services used at run time

- GitHub public REST API (no key; evidence source).
- Meterless Nightshift / Zetaris Cloud Gateway — only when the participant
  configures organiser-issued credentials (see SPONSOR-TECH.md for the
  honest status of that access during this event).

No other person's code, data, or assets are included. License: MIT.
