# Slide deck — HireSense Explain-Why (Open Agent Hackathon 2026, Track 02)

Solo team "Khizar Solo". One slide per required point, in submission order.
Speaker notes and visual direction under each slide. Convert to PDF/PPTX for
the HackOS upload; keep the wording, it is written to be read by judges who
have not seen the demo yet.

---

## Slide 1 — The problem

**Hiring scores are verdicts without reasons.**

- Recruiters screen hundreds of candidates with AI tools that output a
  number — and nothing else. No evidence, no audit trail, no way to defend
  the decision to a hiring manager, or to the candidate.
- The evidence that *should* drive the decision is fragmented: a CV in one
  system, public code in another, the job spec in a third. Nobody joins it
  up, so claims on a CV are taken on faith and real proof in code is missed.
- When a candidate is re-screened months later, the tool has forgotten the
  first screening entirely. Every evaluation starts from zero.

*Speaker note: This is the Track 02 problem statement — complex questions
answered across multiple data sources need evidence-backed answers, not
scores.*
*Visual: a bare "Score: 87" card with a large question mark over it.*

## Slide 2 — The solution

**HireSense Explain-Why: an agent that investigates a candidate and shows
its work.**

- For every job requirement, the agent returns one of two things: the
  **evidence** (quoted, with its source and a confidence level) — or an
  honestly named **gap**.
- The output is a recruiter-ready report: verdict first, then per-claim
  evidence, the full reasoning trace, and the gaps to probe in interview.
- Built as an extension of HireSense, an existing AI recruitment tool that
  already scans resumes and rates candidate–job matches. Explain-Why is the
  missing layer: *why* the rating is what it is.

*Speaker note: One line to remember — "cite-or-abstain": the agent may only
claim what it can cite.*
*Visual: the sample report (examples/sample-report.md) as a screenshot-style
mock, verdict and one evidence line highlighted.*

## Slide 3 — How it works

**Federate → reason → remember → explain.**

1. **Federate.** Three fragmented sources — CV data, live public GitHub
   code, the job description — are unified behind one data layer, every
   snapshot stamped with its provenance and federation route.
2. **Reason.** A cite-or-abstain reasoning contract scores each requirement
   against the evidence pack: two agreeing sources = high confidence, one
   source = medium, indirect = low, none = a named gap.
3. **Remember.** Every screening is written to memory and consolidated, so
   the next screening of the same person produces a *delta* explanation.
4. **Explain.** The report renders verdict, evidence, confidence, gaps,
   reasoning trace and memory — as Markdown for humans and JSON for systems.

*Visual: the pipeline diagram from the README (sources → unified layer →
reasoner → H-MEM → report).*

## Slide 4 — Sponsor technology

**Zetaris for data, Meterless Nightshift + NVIDIA Nemotron for power,
Meterless H-MEM as the engine, Cursor-first build.**

- **Zetaris Lightning** is the federation seat: the unified layer routes
  through the Zetaris Cloud Gateway when configured (SQL probe first,
  provenance stamp on every snapshot).
- **Meterless Nightshift** is the primary AI provider: one real request per
  evaluation carries the evidence pack to an **NVIDIA Nemotron** model under
  a strict cite-or-abstain prompt contract; model and request id land in the
  reasoning trace.
- **Meterless Engine implemented: H-MEM** — hierarchical memory (working /
  episodic / semantic tiers) powering the "what changed since last time?"
  feature, proven by an automated engine test.
- **Cursor** — developed in an AI-assisted, Cursor-first workflow.
- Honest status, in full, in SPONSOR-TECH.md: organiser-issued
  Nightshift/Zetaris access never activated during the event, so those two
  layers ship complete and contract-tested with loud, trace-level fallback —
  the agent never claims a call it did not make.

*Visual: four-layer stack diagram (Data / Power / Engine / Build) with the
code file for each layer named.*

## Slide 5 — The demo

**Ninety seconds, three beats, zero slides-instead-of-product.**

1. **Strong fit.** One command screens a real candidate profile against a
   full-stack role — live GitHub evidence is fetched, the verdict is 100/100
   and every requirement shows its citation.
2. **Explain why NOT.** A junior candidate against the same role: 20/100,
   four named gaps. The agent refuses to inflate.
3. **Memory.** Re-run the first screening: the report recalls the earlier
   verdict and states what changed. That is H-MEM working, live.

*Visual: terminal screenshot trio from the actual demo runs.*
*Speaker note: the full 1–4 minute video follows DEMO-SCRIPT.md; sample
output is committed at examples/sample-report.md.*

## Slide 6 — Impact

**Trustworthy screening is a fairness feature, not a reporting feature.**

- Recruiters get decisions they can defend: to hiring managers, to
  compliance, and to rejected candidates asking "why not me?"
- Candidates get judged on evidence that exists — including proof in public
  code that a keyword-matching ATS never looks at.
- Teams get continuity: memory turns one-off screening into an auditable
  history of a candidate's growth ("Kubernetes: newly evidenced since
  March") — evidence of learning, not just a new score.
- The pattern generalises beyond hiring: any high-stakes scoring domain
  (credit, grants, admissions) needs verdicts that cite their evidence.

*Visual: three audience cards — recruiter, candidate, hiring team — one
benefit line each.*

## Slide 7 — Innovation

**Explanations as a first-class, longitudinal artifact.**

- **Per-claim provenance by construction**: evidence is attached when a
  claim is made, not reconstructed afterwards — the trace cannot drift from
  the verdict.
- **Confidence from source agreement**, a simple, inspectable rule a
  recruiter can reason about — not a model's self-reported certainty.
- **Longitudinal explanation**: to our knowledge, screening tools report a
  candidate's present; H-MEM makes the agent report their *trajectory* —
  what was evidenced, what is still missing, what changed.
- **Honest degradation as a design principle**: every layer announces its
  own fallbacks in the trace. An agent that says what it did is the
  explainability thesis applied to the agent itself.

*Visual: side-by-side — a bare score vs. the Explain-Why report for the
same candidate.*

## Slide 8 — Team, declaration, and what's next

**Solo build, clean declarations, clear road ahead.**

- **Team**: "Khizar Solo" — Muhammad Khizar, Software Engineer II
  (Dynamics 365 / Power Platform; full-stack + AI projects incl. HireSense),
  Karachi, Pakistan, building remotely.
- **Declaration**: HireSense (the base matching product), the demo profile
  data and the participant's public GitHub data predate the build window and
  are declared in PRE-EXISTING.md. Everything in the submitted repository —
  federation, reasoning, H-MEM engine, reports, tests, docs — is new work
  from 22–27 Oct 2026. No code is shared with the participant's separate
  NVIDIA × Nebius hackathon entry.
- **Next**: activate the Nightshift + Zetaris live paths the day
  organiser-issued access lands (both are config-only switches); CV-PDF
  ingestion to replace fixture CVs; a recruiter web UI over the same report
  engine; multi-candidate ranking with comparative explanations.

*Visual: timeline — pre-existing base (before 22 Oct) → this build (22–27
Oct) → next steps.*
