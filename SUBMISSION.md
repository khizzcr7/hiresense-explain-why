# HackOS submission — pre-filled fields and checklist

Event: Open Agent Hackathon 2026 · Team: **Khizar Solo** (solo, Muhammad Khizar, primary contact)
**Deadline: 27 Oct 2026, 23:45 UTC (= Wed 28 Oct 04:45 PKT).** Team roster LOCKS at first submission.

## Form fields (paste-ready)

- **Project name:** HireSense Explain-Why
- **Primary track:** Track 02 — The Agent That Can Explain Why
- **Team members:** Muhammad Khizar (solo; only member and primary contact)
- **Short description:**
  An agent that investigates a job candidate across fragmented sources —
  their CV, their live public code, and the job description — and produces
  an evidence-backed hiring recommendation in which every claim cites its
  source, carries a confidence level, and names its gaps. A hierarchical
  memory engine (H-MEM) lets it answer the follow-up question too: what
  changed since this candidate was last screened?
- **GitHub repo:** https://github.com/khizzcr7/hiresense-explain-why *(to be
  created and pushed — see checklist; README carries setup, usage and
  dependencies: Node ≥ 18, zero npm dependencies)*
- **Demo video:** *(upload after recording per DEMO-SCRIPT.md; 1–4 min)*
- **Slide deck:** *(upload PDF/PPTX converted from SLIDES.md — 8 required
  points, one per slide)*
- **Sponsor-tech explanation:** *(full text in SPONSOR-TECH.md; summary for
  the form:)* Zetaris Lightning is the federation layer for the agent's
  fragmented sources (unified data layer with gateway routing and
  provenance stamps). Meterless Nightshift is the primary AI provider with
  NVIDIA Nemotron as the reasoning model, under a cite-or-abstain prompt
  contract. The Meterless Engine implemented is **H-MEM** (hierarchical
  memory: working/episodic/semantic tiers), proven by the engine test in
  `test/run.test.js` ("H-MEM engine: remembers an evaluation and explains
  the change") and by running the demo twice. Developed in a Cursor-first,
  AI-assisted workflow. Organiser-issued Nightshift/Zetaris access was
  never activated during the event, so those two integrations ship complete
  and contract-tested with trace-announced local fallbacks — the agent
  never claims a sponsor call it did not make (full honest status:
  SPONSOR-TECH.md).
- **Declaration of pre-existing components:** *(full text in
  PRE-EXISTING.md; summary:)* HireSense base product (resume scanning and
  candidate–job rating), the demo candidate profile data, and the
  participant's public GitHub data all predate 22 Oct 2026 00:00 UTC and
  are declared. Everything in the submitted repository is new work from the
  build window. No code is shared with the participant's separate
  NVIDIA × Nebius hackathon entry.
- **Colab links:** none used.

## Remaining steps (browser / human, in order)

1. [ ] Create public GitHub repo `khizzcr7/hiresense-explain-why` and upload
       the staged folder `~/workspace/small-cash/upload-staging/open-agent/`
       via the GitHub web UI (same route as carbonproof/briefme). Verify
       the repo root shows README rendered + `src/`, `examples/`, `test/`.
2. [ ] In the new repo, sanity-run from the *uploaded* copy is already done
       locally (staging verified: `npm test` 5/5, demos run). No further
       code step needed.
3. [ ] Convert SLIDES.md to PDF or PPTX (8 slides, keep wording).
4. [ ] Record the demo video per DEMO-SCRIPT.md (target ~3 min, hard cap
       4:00). Khizar's own voiceover preferred; TTS is the fallback. If
       Nightshift access lands before recording, Beat 1 shows the real
       Nightshift request automatically — re-check `.env` presence first,
       and keep keys off screen either way.
5. [ ] HackOS → team "Khizar Solo" → Add Submission: paste the fields
       above, select Track 02 in the form (track selection lives inside
       the submission form), attach repo link, video, deck. Roster locks on
       first submission — solo roster is already correct.
6. [ ] Cross-check the form's eight slide-point headings against SLIDES.md
       titles at submit time (the exact headings live in the HackOS
       "How the Week Runs" lesson) and rename slide titles if the form
       words any point differently.
7. [ ] Submit well before Wed 28 Oct 04:45 PKT; screenshot the confirmation.

## Verified locally (24 Oct 2026)

- `npm test` — 5/5 pass (reasoner evidence/gaps, Nightshift contract,
  Zetaris contract, H-MEM engine).
- `node examples/run-demo.js` — strong-fit report, live GitHub fetch,
  memory section on re-run.
- `node examples/run-demo-gaps.js` — weak-fit report with named gaps.
- CLI markdown + `--json` output verified against both fixture jobs.
