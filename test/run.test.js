/**
 * Smoke + engine tests. Run: npm test   (node --test, zero dependencies)
 *
 * The H-MEM test here is the "test that shows the engine works" referenced by
 * the submission's sponsor-tech explanation: it proves the agent remembers a
 * prior screening and can explain what changed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { LocalReasoner, NightshiftNemotronReasoner, NightshiftNotConfiguredError, createReasoner } from '../src/reasoner.js';
import { ZetarisClient, ZetarisNotConfiguredError } from '../src/zetaris.js';
import { HMemEngine } from '../src/engines/hmem.js';
import { toMarkdown } from '../src/report.js';

const snapshots = [
  { source: 'cv-pdf', type: 'cv', data: { source: 'cv-pdf', skills: ['React', 'Node.js'], summary: '' } },
  { source: 'github', type: 'code', data: { source: 'github', repos: [{ name: 'api-server', description: 'REST APIs with Express', language: 'JavaScript', url: 'https://example.invalid/x' }] } },
  { source: 'job-description', type: 'job', data: { source: 'job-description', title: 'Dev', requirements: ['React', 'Kubernetes'], niceToHave: [] } },
];
const jobSpec = { title: 'Dev', requirements: ['React', 'Kubernetes'], niceToHave: [] };

test('LocalReasoner: verdicts cite evidence and surface gaps', async () => {
  const r = await new LocalReasoner().reason(snapshots, jobSpec);
  const react = r.requirementVerdicts.find(v => v.requirement === 'React');
  const kube = r.requirementVerdicts.find(v => v.requirement === 'Kubernetes');
  assert.equal(react.satisfied, true);
  assert.ok(react.evidence.length >= 1, 'satisfied verdict must cite evidence');
  assert.equal(kube.satisfied, false);
  assert.ok(kube.gaps.length >= 1, 'unsatisfied verdict must name the gap');
  assert.equal(r.score, 50);
});

test('Nightshift reasoner refuses to run unconfigured (no fake calls)', async () => {
  const nr = new NightshiftNemotronReasoner({ baseUrl: '', apiKey: '', model: '' });
  assert.equal(nr.configured, false);
  await assert.rejects(() => nr.reason(snapshots, jobSpec), NightshiftNotConfiguredError);
  const fallback = createReasoner({ log: () => {} });
  assert.equal(fallback.backend, 'local-heuristic');
});

test('Nightshift reasoner parses a Nemotron JSON verdict (mock transport)', async () => {
  const payload = {
    id: 'chatcmpl-test-1',
    choices: [{ message: { content: JSON.stringify({
      score: 50, verdict: 'partial fit',
      requirementVerdicts: [
        { requirement: 'React', satisfied: true, confidence: 'high', evidence: [{ source: 'cv-pdf', claim: 'CV lists React', detail: '' }], gaps: [] },
        { requirement: 'Kubernetes', satisfied: false, confidence: 'low', evidence: [], gaps: ['No Kubernetes evidence'] },
      ],
      niceToHaveVerdicts: [], gaps: ['No Kubernetes evidence'], reasoningTrace: ['Compared CV and code evidence to requirements.'],
    }) } }],
  };
  const nr = new NightshiftNemotronReasoner({
    baseUrl: 'https://nightshift.example.invalid/v1', apiKey: 'test-key', model: 'nemotron-test',
    fetchImpl: async () => ({ ok: true, json: async () => payload }),
  });
  const r = await nr.reason(snapshots, jobSpec);
  assert.equal(r.backend, 'meterless-nightshift+nemotron');
  assert.equal(r.requestId, 'chatcmpl-test-1');
  assert.equal(r.score, 50);
  assert.equal(r.requirementVerdicts.length, 2);
});

test('Zetaris client: unconfigured throws; configured probe returns rows (mock transport)', async () => {
  const z = new ZetarisClient({ gatewayUrl: '', apiKey: '' });
  assert.equal(z.configured, false);
  await assert.rejects(() => z.query('SELECT 1'), ZetarisNotConfiguredError);
  const zc = new ZetarisClient({
    gatewayUrl: 'https://zetaris.example.invalid', apiKey: 'test-key',
    fetchImpl: async () => ({ ok: true, json: async () => ({ rows: [[1]] }) }),
  });
  const probe = await zc.probe();
  assert.equal(probe.ok, true);
});

test('H-MEM engine: remembers an evaluation and explains the change', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'hmem-'));
  const storePath = path.join(dir, 'mem.json');
  try {
    const mem = new HMemEngine({ storePath });
    const r1 = await new LocalReasoner().reason(snapshots, jobSpec);
    const first = await mem.consolidate({ candidateId: 'c1', candidateName: 'C One', jobTitle: 'Dev', result: r1 });
    assert.equal(first.change, null, 'first evaluation has no predecessor');

    // Candidate gains Kubernetes evidence; re-screen.
    const snapshots2 = structuredClone(snapshots);
    snapshots2[0].data.skills = ['React', 'Node.js', 'Kubernetes'];
    const r2 = await new LocalReasoner().reason(snapshots2, jobSpec);
    const second = await mem.consolidate({ candidateId: 'c1', candidateName: 'C One', jobTitle: 'Dev', result: r2 });
    assert.equal(second.change.previousScore, 50);
    assert.equal(second.change.scoreDelta, 50);
    assert.deepEqual(second.change.newlySatisfied, ['Kubernetes']);

    const recall = await mem.recall('c1', 'Dev');
    assert.equal(recall.episodeCount, 2);
    assert.equal(recall.facts.evidenceStrength.Kubernetes.satisfiedCount, 1);

    r2.memory = { change: second.change, facts: recall.facts };
    const md = toMarkdown(r2, { candidate: 'C One', jobTitle: 'Dev' });
    assert.match(md, /Memory \(H-MEM engine\)/);
    assert.match(md, /Newly evidenced since last time: Kubernetes/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
