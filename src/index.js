#!/usr/bin/env node
/**
 * explain-why CLI.
 *
 *   node src/index.js <candidate.json> <job.json> [--json] [--backend auto|local] [--no-memory]
 *
 * Pipeline: fragmented sources -> unified layer (Zetaris-routed when a
 * gateway is configured) -> reasoning (Meterless Nightshift + NVIDIA
 * Nemotron when configured, local heuristic otherwise) -> H-MEM memory
 * recall/consolidation -> Explain-Why report.
 */
import { CvSource, GitHubSource, JobDescriptionSource, UnifiedDataLayer } from './sources.js';
import { ZetarisClient } from './zetaris.js';
import { createReasoner } from './reasoner.js';
import { HMemEngine } from './engines/hmem.js';
import { toMarkdown, toJson } from './report.js';
import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const [candidatePath, jobPath] = args.filter(a => a.endsWith('.json'));
const backendFlag = args.includes('--backend')
  ? args[args.indexOf('--backend') + 1]
  : 'auto';
const useMemory = !args.includes('--no-memory');

async function main() {
  if (!candidatePath || !jobPath) {
    console.error('Usage: explain-why <candidate.json> <job.json> [--json] [--backend auto|local] [--no-memory]');
    process.exit(1);
  }
  const candidate = JSON.parse(await readFile(candidatePath, 'utf8'));
  const jobSpec = JSON.parse(await readFile(jobPath, 'utf8'));
  const candidateId = candidate.id || candidate.githubUsername || candidate.name;

  const layer = new UnifiedDataLayer(
    [
      new CvSource(candidate),
      new GitHubSource(candidate.githubUsername, candidate.githubFallback || []),
      new JobDescriptionSource(jobSpec),
    ],
    { zetaris: new ZetarisClient() }
  );

  const snapshots = await layer.fetchAll();
  console.error(`Federation: ${layer.federationNote}`);

  const memory = useMemory ? new HMemEngine() : null;
  const recalled = memory ? await memory.recall(candidateId, jobSpec.title) : null;
  if (recalled?.episodeCount) {
    console.error(`H-MEM recall: ${recalled.episodeCount} prior episode(s) for this candidate + role.`);
  }

  const reasoner = createReasoner({ prefer: backendFlag === 'local' ? 'local' : 'auto' });
  const result = await reasoner.reason(snapshots, jobSpec);
  result.reasoningTrace.push(`Data federation: ${layer.federationNote}`);

  if (memory) {
    for (const v of result.requirementVerdicts) memory.noteClaim(v.requirement);
    const { change } = await memory.consolidate({
      candidateId,
      candidateName: candidate.name,
      jobTitle: jobSpec.title,
      result,
    });
    result.memory = { change, facts: (await memory.recall(candidateId)).facts };
    console.error(`H-MEM: episode stored (${change ? `score delta ${change.scoreDelta > 0 ? '+' : ''}${change.scoreDelta}` : 'first evaluation'}).`);
  }

  const out = args.includes('--json')
    ? toJson(result)
    : toMarkdown(result, { candidate: candidate.name, jobTitle: jobSpec.title });
  console.log(out);
}

main().catch(err => { console.error('explain-why failed:', err.message); process.exit(1); });
