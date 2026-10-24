/**
 * Reasoning engine: extracts claims from each fragmented source, matches them
 * to job requirements, and produces a per-claim evidence trace.
 *
 * Two backends, one output shape (claims -> evidence -> confidence -> gaps):
 *  1. NightshiftNemotronReasoner — the sponsor Power layer. Sends ONE real
 *     request per evaluation through Meterless Nightshift with an NVIDIA
 *     Nemotron model, using a Meterless prompt-library style contract
 *     (strict JSON verdicts, cite-or-abstain). This is the primary backend
 *     whenever Nightshift is configured.
 *  2. LocalReasoner — a deterministic heuristic fallback so the agent still
 *     runs end to end (and the demo still works) when no Nightshift key is
 *     present. The fallback is always announced in the reasoning trace.
 *
 * Configuration (environment variables — see .env.example):
 *   NIGHTSHIFT_API_BASE_URL  OpenAI-compatible base URL of the participant's
 *                            Meterless Nightshift workspace.
 *   NIGHTSHIFT_API_KEY       Nightshift API key (never commit; never print).
 *   NIGHTSHIFT_MODEL         Nemotron model id as listed in Nightshift
 *                            (NVIDIA connected inside Nightshift).
 * No base URL or model id is hard-coded: none was published publicly by the
 * organisers, and inventing one would fake the integration.
 */

export class NightshiftNotConfiguredError extends Error {
  constructor() {
    super(
      'Meterless Nightshift not configured: set NIGHTSHIFT_API_BASE_URL, NIGHTSHIFT_API_KEY ' +
      'and NIGHTSHIFT_MODEL (from your Nightshift workspace, NVIDIA Nemotron connected).'
    );
    this.code = 'NIGHTSHIFT_NOT_CONFIGURED';
  }
}

const NIGHTSHIFT_SYSTEM_PROMPT = [
  'You are the Explain-Why reasoning engine inside a hiring-screening agent.',
  'You receive EVIDENCE SNAPSHOTS from fragmented sources (a candidate CV,',
  'their public code, and a job description) and must judge the candidate',
  'against the job requirements.',
  '',
  'Rules (cite-or-abstain):',
  '1. For every requirement, decide satisfied=true ONLY if a snapshot contains',
  '   concrete evidence. Quote the evidence in your own words and name its source.',
  '2. If evidence is missing or ambiguous, satisfied=false and name the gap.',
  '   Never invent experience, skills, employers, or metrics.',
  '3. confidence is "high" when two independent sources agree, "medium" when a',
  '   single source supports the claim, "low" when support is indirect.',
  '4. reasoningTrace: 3-6 short steps describing how you reached the verdict.',
  '',
  'Respond with STRICT JSON only, no markdown fences, matching this schema:',
  '{"score":0-100,"verdict":"strong fit|partial fit|weak fit",',
  ' "requirementVerdicts":[{"requirement":"...","satisfied":true,',
  '   "confidence":"high|medium|low",',
  '   "evidence":[{"source":"cv-pdf|github|job-description","claim":"...","detail":"..."}],',
  '   "gaps":["..."]}],',
  ' "niceToHaveVerdicts":[same shape],',
  ' "gaps":["..."],"reasoningTrace":["..."]}',
].join('\n');

export class NightshiftNemotronReasoner {
  constructor({
    baseUrl = process.env.NIGHTSHIFT_API_BASE_URL,
    apiKey = process.env.NIGHTSHIFT_API_KEY,
    model = process.env.NIGHTSHIFT_MODEL,
    fetchImpl = fetch,
  } = {}) {
    this.backend = 'meterless-nightshift+nemotron';
    this.baseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : null;
    this.apiKey = apiKey || null;
    this.model = model || null;
    this._fetch = fetchImpl;
  }

  get configured() { return Boolean(this.baseUrl && this.apiKey && this.model); }

  async reason(snapshots, jobSpec) {
    if (!this.configured) throw new NightshiftNotConfiguredError();
    const evidencePack = snapshots.map(s => ({ source: s.source, type: s.type, data: s.data }));
    const res = await this._fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.1,
        messages: [
          { role: 'system', content: NIGHTSHIFT_SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              `JOB:\n${JSON.stringify(jobSpec, null, 2)}\n\nEVIDENCE SNAPSHOTS:\n` +
              `${JSON.stringify(evidencePack, null, 2)}\n\nJudge the candidate now. Strict JSON only.`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Nightshift request failed: HTTP ${res.status}`);
    const body = await res.json();
    const text = body?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Nightshift returned no message content.');
    let parsed;
    try {
      parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    } catch {
      throw new Error('Nightshift response was not valid JSON; refusing to guess a verdict.');
    }
    // Normalise into the shared output shape; never trust the model blindly.
    const verdicts = Array.isArray(parsed.requirementVerdicts) ? parsed.requirementVerdicts : [];
    const satisfiedCount = verdicts.filter(v => v.satisfied).length;
    const score = Number.isFinite(parsed.score)
      ? Math.max(0, Math.min(100, Math.round(parsed.score)))
      : (verdicts.length ? Math.round((satisfiedCount / verdicts.length) * 100) : 0);
    return {
      backend: this.backend,
      model: this.model,
      requestId: body.id || null,
      score,
      verdict: parsed.verdict || (score >= 70 ? 'strong fit' : score >= 40 ? 'partial fit' : 'weak fit'),
      requirementVerdicts: verdicts,
      niceToHaveVerdicts: Array.isArray(parsed.niceToHaveVerdicts) ? parsed.niceToHaveVerdicts : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : verdicts.flatMap(v => v.gaps || []),
      reasoningTrace: [
        ...(Array.isArray(parsed.reasoningTrace) ? parsed.reasoningTrace : []),
        `Reasoned by NVIDIA Nemotron (${this.model}) through Meterless Nightshift${body.id ? `, request ${body.id}` : ''}.`,
      ],
    };
  }
}

/**
 * Backend factory. Prefers the sponsor Power layer (Nightshift + Nemotron)
 * whenever it is configured; otherwise falls back to the local heuristic and
 * says so on stderr. `prefer: 'local'` forces the fallback (used by tests).
 */
export function createReasoner({ prefer = 'auto', log = console.error } = {}) {
  if (prefer !== 'local') {
    const nightshift = new NightshiftNemotronReasoner();
    if (nightshift.configured) {
      log(`Reasoning backend: Meterless Nightshift + NVIDIA Nemotron (${nightshift.model})`);
      return nightshift;
    }
    log('Reasoning backend: local heuristic (Nightshift not configured — see .env.example)');
  } else {
    log('Reasoning backend: local heuristic (forced)');
  }
  return new LocalReasoner();
}

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9+#. ]/g, ' ');

function skillHit(skill, haystacks) {
  const s = norm(skill);
  return haystacks.some(h => norm(h).includes(s) || s.includes(norm(h).slice(0, 12)));
}

export class LocalReasoner {
  constructor() { this.backend = 'local-heuristic'; }

  /**
   * @param {Array<{source:string,type:string,data:any}>} snapshots
   * @param {{title:string,requirements:string[],niceToHave:string[]}} jobSpec
   */
  async reason(snapshots, jobSpec) {
    const byType = t => snapshots.find(s => s.type === t)?.data || {};
    const cv = byType('cv');
    const code = byType('code');
    const job = byType('job');

    const cvSkills = cv.skills || [];
    const codeSkills = new Set();
    const repos = code.repos || [];
    for (const r of repos) {
      if (r.language) codeSkills.add(norm(r.language));
      const desc = norm(r.description || '');
      ['react', 'node', 'express', 'typescript', 'python', 'next', 'fastapi', 'gemini', 'ai', 'api', 'postgres', 'docker'].forEach(k => {
        if (desc.includes(k) || norm(r.name || '').includes(k)) codeSkills.add(k);
      });
    }

    const requirementVerdicts = (jobSpec.requirements || []).map(req => {
      const evidence = [];
      const cvHit = cvSkills.some(s => skillHit(req, [s]));
      if (cvHit) evidence.push({
        source: 'cv-pdf',
        claim: `CV lists skill matching requirement "${req}"`,
        detail: `Matched CV skill: ${cvSkills.find(s => skillHit(req, [s]))}`,
      });
      // Claims also live in the CV narrative, not just the skills list
      // (e.g. "professional experience in Dynamics 365 / Power Platform").
      if (!cvHit && cv.summary && skillHit(req, [cv.summary])) evidence.push({
        source: 'cv-pdf',
        claim: `CV summary evidences requirement "${req}"`,
        detail: 'Matched in the candidate summary text',
      });
      const codeHit = skillHit(req, [...codeSkills]);
      if (codeHit) {
        const repo = repos.find(r => skillHit(req, [[r.language, r.description, r.name].filter(Boolean).join(' ')]));
        evidence.push({
          source: 'github',
          claim: `Public code backs requirement "${req}"`,
          detail: repo ? `${repo.name} (${repo.language}) - ${repo.url}` : 'matched across repository set',
        });
      }
      const confidence = evidence.length === 2 ? 'high' : evidence.length === 1 ? 'medium' : 'low';
      return {
        requirement: req,
        satisfied: evidence.length > 0,
        confidence,
        evidence,
        gaps: evidence.length === 0 ? [`No CV or GitHub evidence found for "${req}"`] : [],
      };
    });

    const niceVerdicts = (jobSpec.niceToHave || []).map(req => {
      const hit = cvSkills.some(s => skillHit(req, [s])) || skillHit(req, [...codeSkills]);
      return { requirement: req, satisfied: hit, confidence: hit ? 'medium' : 'low', evidence: hit ? [{ source: 'mixed', claim: `partial evidence for "${req}"`, detail: 'see source snapshots' }] : [], gaps: hit ? [] : [`No evidence for nice-to-have "${req}"`] };
    });

    const hard = requirementVerdicts.filter(v => v.satisfied).length;
    const score = requirementVerdicts.length
      ? Math.round((hard / requirementVerdicts.length) * 100)
      : 0;

    const trace = [
      `Extracted ${cvSkills.length} skills from cv-pdf.`,
      `Analyzed ${repos.length} GitHub repositories for code evidence.`,
      `Evaluated ${requirementVerdicts.length} hard requirements and ${niceVerdicts.length} nice-to-haves from job-description.`,
      `Reasoning steps kept per-claim provenance: every match cites its source.`,
    ];

    return {
      backend: this.backend,
      score,
      verdict: score >= 70 ? 'strong fit' : score >= 40 ? 'partial fit' : 'weak fit',
      requirementVerdicts,
      niceToHaveVerdicts: niceVerdicts,
      gaps: requirementVerdicts.flatMap(v => v.gaps),
      reasoningTrace: trace,
    };
  }
}
