/**
 * Fragmented data sources. Each source exposes a stable schema regardless of
 * where the data ultimately lives (local fixture now, Zetaris cloud later).
 */

export class DataSource {
  constructor(name, type) {
    this.name = name;   // e.g. 'cv-pdf', 'github', 'job-description'
    this.type = type;   // 'cv' | 'code' | 'job'
  }
  async fetch() { throw new Error(`DataSource.fetch() not implemented for ${this.name}`); }
  async search(query) {
    const data = await this.fetch();
    const hay = JSON.stringify(data).toLowerCase();
    return hay.includes(String(query).toLowerCase()) ? data : null;
  }
}

/** Source 1: CV data (fixture stands in for the CV-PDF ingest). */
export class CvSource extends DataSource {
  constructor(fixture) { super('cv-pdf', 'cv'); this.fixture = fixture; }
  async fetch() {
    const text = this.fixture.summary || '';
    const skills = this.fixture.skills || [];
    return { source: this.name, summary: text, skills, raw: this.fixture };
  }
}

/** Source 2: GitHub repos via the public API (live call; falls back to fixture). */
export class GitHubSource extends DataSource {
  constructor(username, fallback = []) {
    super('github', 'code');
    this.username = username;
    this.fallback = fallback;
  }
  async fetch() {
    try {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(this.username)}/repos?per_page=100`,
        { headers: { 'User-Agent': 'hiresense-explain-why' } }
      );
      if (res.ok) {
        const repos = await res.json();
        return {
          source: this.name,
          repoCount: repos.length,
          repos: repos.map(r => ({
            name: r.name,
            description: r.description || '',
            language: r.language,
            stars: r.stargazers_count,
            updatedAt: r.updated_at,
            url: r.html_url,
          })),
        };
      }
      throw new Error(`GitHub API ${res.status}`);
    } catch (err) {
      return { source: this.name, degraded: true, reason: String(err), repos: this.fallback };
    }
  }
}

/** Source 3: the job description / spec being screened against. */
export class JobDescriptionSource extends DataSource {
  constructor(spec) { super('job-description', 'job'); this.spec = spec; }
  async fetch() {
    return {
      source: this.name,
      title: this.spec.title,
      requirements: this.spec.requirements || [],
      niceToHave: this.spec.niceToHave || [],
      raw: this.spec,
    };
  }
}

/**
 * The semantic layer: unified access + provenance for all sources.
 *
 * Federation routing (Zetaris Lightning): pass a configured ZetarisClient
 * (see zetaris.js) and fetchAll() probes the Zetaris Cloud Gateway first;
 * every snapshot is then stamped `federatedVia: 'zetaris-lightning'`. With
 * no gateway configured the layer federates directly and stamps
 * `federatedVia: 'local'`. Either way, every claim below already carries
 * source provenance, so routing never changes the shape of the evidence —
 * only where the federation happens.
 */
export class UnifiedDataLayer {
  constructor(sources, { zetaris = null } = {}) {
    this.sources = sources;
    this.zetaris = zetaris;
    this.federatedVia = 'local';
    this.federationNote = 'Zetaris gateway not configured; direct local federation used.';
  }
  async fetchAll() {
    if (this.zetaris?.configured) {
      try {
        await this.zetaris.probe();
        this.federatedVia = 'zetaris-lightning';
        this.federationNote = 'Federation routed through Zetaris Lightning (gateway probe OK).';
      } catch (err) {
        this.federatedVia = 'local';
        this.federationNote = `Zetaris gateway probe failed (${err.message}); fell back to direct local federation.`;
      }
    }
    const snapshots = [];
    for (const s of this.sources) {
      const data = await s.fetch();
      snapshots.push({ source: s.name, type: s.type, federatedVia: this.federatedVia, data });
    }
    return snapshots;
  }
  names() { return this.sources.map(s => s.name); }
}
