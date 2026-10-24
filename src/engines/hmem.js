/**
 * H-MEM — hierarchical memory engine (Meterless Engine pattern).
 *
 * The agent's memory is organised in the three tiers the H-MEM pattern
 * prescribes, so recall is cheap and explanations can cite *what the agent
 * already knows* about a candidate:
 *
 *   Tier 1 — Working memory:  the current run only (claims under evaluation).
 *   Tier 2 — Episodic memory: an append-only log of past evaluations
 *            (who was screened, for which job, what verdict, when).
 *   Tier 3 — Semantic memory: facts consolidated from episodes — per-candidate
 *            evidence strengths and recurring gaps that survive across runs.
 *
 * This is a working local implementation of the H-MEM engine interface. It is
 * deliberately storage- and transport-agnostic: swap the JSON file store for
 * the hosted Meterless H-MEM service (via Meterless Nightshift) and the rest
 * of the agent does not change. See SPONSOR-TECH.md for the honest status of
 * the hosted connection.
 *
 * The engine is a *feature*, not plumbing: HireSense Explain-Why uses recall
 * to answer "what changed since we last screened this person?" — the second
 * question every recruiter asks, and the one a stateless scorer cannot answer.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const EMPTY_STORE = { episodes: [], facts: { candidates: {} } };

export class HMemEngine {
  /**
   * @param {{ storePath?: string }} [opts] storePath defaults to
   *   process.env.HMEM_PATH or '.explain-why-memory.json' in the cwd.
   */
  constructor({ storePath } = {}) {
    this.engine = 'H-MEM';
    this.storePath = storePath || process.env.HMEM_PATH || '.explain-why-memory.json';
    this.working = { claims: [], startedAt: null };
    this._store = null;
  }

  async _load() {
    if (this._store) return this._store;
    try {
      this._store = JSON.parse(await readFile(this.storePath, 'utf8'));
      if (!this._store.episodes || !this._store.facts) this._store = structuredClone(EMPTY_STORE);
    } catch {
      this._store = structuredClone(EMPTY_STORE);
    }
    return this._store;
  }

  async _save() {
    await mkdir(path.dirname(path.resolve(this.storePath)), { recursive: true });
    await writeFile(this.storePath, JSON.stringify(this._store, null, 2));
  }

  /** Tier 1: note a claim in the current run's working memory. */
  noteClaim(claim) {
    if (!this.working.startedAt) this.working.startedAt = new Date().toISOString();
    this.working.claims.push(claim);
  }

  /**
   * Recall everything the agent knows about a candidate (optionally for one
   * job). Returns episodic history + consolidated semantic facts. This is the
   * read path the report generator uses for its "Memory (H-MEM)" section.
   */
  async recall(candidateId, jobTitle = null) {
    const store = await this._load();
    const episodes = store.episodes.filter(
      e => e.candidateId === candidateId && (jobTitle === null || e.jobTitle === jobTitle)
    );
    const facts = store.facts.candidates[candidateId] || null;
    return {
      episodeCount: episodes.length,
      lastEpisode: episodes.length ? episodes[episodes.length - 1] : null,
      facts,
    };
  }

  /**
   * Consolidate a finished evaluation: append the episode (Tier 2) and fold
   * its verdicts into semantic facts (Tier 3). Returns a change summary versus
   * the previous episode for the same candidate + job — the delta a recruiter
   * actually reads.
   */
  async consolidate({ candidateId, candidateName, jobTitle, result }) {
    const store = await this._load();
    const prev = store.episodes.filter(
      e => e.candidateId === candidateId && e.jobTitle === jobTitle
    ).at(-1) || null;

    const satisfied = result.requirementVerdicts.filter(v => v.satisfied).map(v => v.requirement);
    const missing = result.requirementVerdicts.filter(v => !v.satisfied).map(v => v.requirement);

    const episode = {
      ts: new Date().toISOString(),
      candidateId,
      candidateName,
      jobTitle,
      score: result.score,
      verdict: result.verdict,
      backend: result.backend,
      satisfied,
      missing,
      gaps: result.gaps || [],
    };
    store.episodes.push(episode);

    // Tier 3: consolidate per-candidate facts.
    const facts = (store.facts.candidates[candidateId] ??= {
      candidateName,
      evaluations: 0,
      evidenceStrength: {},   // requirement -> { satisfiedCount, lastConfidence }
      recurringGaps: {},      // requirement -> timesMissing
      lastSeen: null,
    });
    facts.candidateName = candidateName;
    facts.evaluations += 1;
    facts.lastSeen = episode.ts;
    for (const v of result.requirementVerdicts) {
      if (v.satisfied) {
        const e = (facts.evidenceStrength[v.requirement] ??= { satisfiedCount: 0, lastConfidence: null });
        e.satisfiedCount += 1;
        e.lastConfidence = v.confidence;
      } else {
        facts.recurringGaps[v.requirement] = (facts.recurringGaps[v.requirement] || 0) + 1;
      }
    }

    await this._save();

    const change = prev
      ? {
          previousScore: prev.score,
          scoreDelta: result.score - prev.score,
          previousVerdict: prev.verdict,
          newlySatisfied: satisfied.filter(s => !prev.satisfied.includes(s)),
          newlyMissing: missing.filter(m => !prev.missing.includes(m)),
          repeatedGaps: missing.filter(m => prev.missing.includes(m)),
          previousTs: prev.ts,
        }
      : null;

    return { episode, change };
  }
}
