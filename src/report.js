/**
 * Explain-Why report generator: renders the reasoning result as a
 * recruiter-facing markdown report where every claim links to evidence.
 */

function badge(c) {
  return { high: 'HIGH', medium: 'MED', low: 'LOW' }[c] || c;
}

export function toMarkdown(result, { candidate = 'Candidate', jobTitle = 'Role' } = {}) {
  const lines = [];
  lines.push(`# Explain-Why Report: ${candidate} vs ${jobTitle}`);
  lines.push('');
  lines.push(`**Verdict: ${result.verdict}** (score ${result.score}/100, reasoned via ${result.backend})`);
  lines.push('');
  lines.push('## Requirements');
  for (const v of result.requirementVerdicts) {
    lines.push(`- **${v.requirement}** - ${v.satisfied ? 'satisfied' : 'NOT satisfied'} [${badge(v.confidence)}]`);
    for (const e of v.evidence) lines.push(`  - evidence (${e.source}): ${e.claim}. ${e.detail || ''}`.trim());
    for (const g of v.gaps) lines.push(`  - gap: ${g}`);
  }
  if (result.niceToHaveVerdicts?.length) {
    lines.push('');
    lines.push('## Nice to have');
    for (const v of result.niceToHaveVerdicts) {
      lines.push(`- ${v.requirement}: ${v.satisfied ? 'present' : 'absent'} [${badge(v.confidence)}]`);
    }
  }
  lines.push('');
  lines.push('## How the agent reached this (reasoning trace)');
  result.reasoningTrace.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  if (result.gaps.length) {
    lines.push('');
    lines.push('## Gaps to investigate');
    result.gaps.forEach(g => lines.push(`- ${g}`));
  }
  if (result.memory) {
    lines.push('');
    lines.push('## Memory (H-MEM engine)');
    const m = result.memory;
    if (!m.change) {
      lines.push('- First recorded evaluation of this candidate for this role. The episode was written to episodic memory and consolidated into semantic facts.');
    } else {
      const d = m.change.scoreDelta;
      lines.push(`- Previously evaluated on ${m.change.previousTs}: ${m.change.previousVerdict}, score ${m.change.previousScore}/100.`);
      lines.push(`- Score change: ${d > 0 ? '+' : ''}${d} points.`);
      if (m.change.newlySatisfied.length) lines.push(`- Newly evidenced since last time: ${m.change.newlySatisfied.join(', ')}.`);
      if (m.change.newlyMissing.length) lines.push(`- Newly missing since last time: ${m.change.newlyMissing.join(', ')}.`);
      if (m.change.repeatedGaps.length) lines.push(`- Still open (repeated gaps): ${m.change.repeatedGaps.join(', ')}.`);
    }
    if (m.facts) {
      const strong = Object.entries(m.facts.evidenceStrength || {})
        .sort((a, b) => b[1].satisfiedCount - a[1].satisfiedCount)
        .slice(0, 5)
        .map(([k, v]) => `${k} (evidenced ${v.satisfiedCount}x)`);
      if (strong.length) lines.push(`- Strongest accumulated evidence: ${strong.join('; ')}.`);
    }
  }
  return lines.join('\n');
}

export function toJson(result) { return JSON.stringify(result, null, 2); }
