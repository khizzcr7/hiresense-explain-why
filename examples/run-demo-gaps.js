/**
 * Second demo: the "explain why NOT" case. A junior candidate is screened
 * against the full-stack job; the report must surface honest gaps instead of
 * inflating the match — the other half of Track 02.
 *
 *   node examples/run-demo-gaps.js
 */
import { CvSource, GitHubSource, JobDescriptionSource, UnifiedDataLayer } from '../src/sources.js';
import { ZetarisClient } from '../src/zetaris.js';
import { createReasoner } from '../src/reasoner.js';
import { HMemEngine } from '../src/engines/hmem.js';
import { toMarkdown } from '../src/report.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const candidate = JSON.parse(await readFile(path.join(dir, '../src/fixtures/candidate-junior.json'), 'utf8'));
const jobSpec = JSON.parse(await readFile(path.join(dir, '../src/fixtures/job-demo.json'), 'utf8'));
const candidateId = candidate.id || candidate.githubUsername || candidate.name;

const layer = new UnifiedDataLayer(
  [
    new CvSource(candidate),
    new GitHubSource(candidate.githubUsername, candidate.githubFallback),
    new JobDescriptionSource(jobSpec),
  ],
  { zetaris: new ZetarisClient() }
);

const snapshots = await layer.fetchAll();
console.error(`Sources fetched: ${layer.names().join(', ')}`);
console.error(`Federation: ${layer.federationNote}`);

const memory = new HMemEngine();
const result = await createReasoner().reason(snapshots, jobSpec);
result.reasoningTrace.push(`Data federation: ${layer.federationNote}`);
const { change } = await memory.consolidate({
  candidateId,
  candidateName: candidate.name,
  jobTitle: jobSpec.title,
  result,
});
result.memory = { change, facts: (await memory.recall(candidateId)).facts };

console.log(toMarkdown(result, { candidate: candidate.name, jobTitle: jobSpec.title }));
