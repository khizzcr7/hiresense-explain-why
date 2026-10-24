/**
 * Zetaris Lightning — federated data layer client.
 *
 * Zetaris is the hackathon's Data layer: fragmented organisational sources
 * (databases, files, APIs) are registered once in Zetaris and queried through
 * one SQL/semantic layer ("Lightning"), instead of the agent hand-wiring every
 * source. HireSense Explain-Why puts Zetaris in exactly that seat:
 *
 *   - Every DataSource in sources.js exposes a stable schema and provenance.
 *   - When a Zetaris Cloud Gateway is configured, UnifiedDataLayer routes its
 *     federation through Zetaris: this client probes the gateway with a SQL
 *     statement and stamps each snapshot `federatedVia: 'zetaris-lightning'`.
 *   - When no gateway is configured (the participant's Zetaris Cloud account
 *     exists, but no gateway/instance endpoint was ever issued during the
 *     event), the layer degrades to direct local federation and stamps
 *     `federatedVia: 'local'` — loudly, in the report trace, never silently.
 *
 * Configuration (environment variables — see .env.example):
 *   ZETARIS_GATEWAY_URL   Base URL of the Zetaris Cloud Gateway for the
 *                         participant's instance (from the Zetaris Cloud
 *                         console / "Verify SQL Connectivity" quick-start).
 *   ZETARIS_API_KEY       API key / token for that gateway.
 *   ZETARIS_SQL_PATH      Path of the SQL endpoint on the gateway
 *                         (default '/sql').
 *
 * No endpoint or key is baked into this file: none was published in the
 * public quick-start docs, and inventing one would fake the integration.
 */

export class ZetarisNotConfiguredError extends Error {
  constructor() {
    super(
      'Zetaris gateway not configured: set ZETARIS_GATEWAY_URL and ZETARIS_API_KEY ' +
      '(from the Zetaris Cloud console for your instance) to route federation through Zetaris Lightning.'
    );
    this.code = 'ZETARIS_NOT_CONFIGURED';
  }
}

export class ZetarisClient {
  constructor({
    gatewayUrl = process.env.ZETARIS_GATEWAY_URL,
    apiKey = process.env.ZETARIS_API_KEY,
    sqlPath = process.env.ZETARIS_SQL_PATH || '/sql',
    fetchImpl = fetch,
  } = {}) {
    this.gatewayUrl = gatewayUrl ? gatewayUrl.replace(/\/+$/, '') : null;
    this.apiKey = apiKey || null;
    this.sqlPath = sqlPath.startsWith('/') ? sqlPath : `/${sqlPath}`;
    this._fetch = fetchImpl;
  }

  get configured() { return Boolean(this.gatewayUrl && this.apiKey); }

  /**
   * Execute a SQL statement against the federated layer.
   * The gateway contract used here is the documented pattern from the Zetaris
   * quick-start (submit SQL, receive tabular JSON); if a given deployment
   * expects a different path, set ZETARIS_SQL_PATH accordingly.
   */
  async query(sql) {
    if (!this.configured) throw new ZetarisNotConfiguredError();
    const res = await this._fetch(`${this.gatewayUrl}${this.sqlPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ sql }),
    });
    if (!res.ok) throw new Error(`Zetaris gateway SQL failed: HTTP ${res.status}`);
    return res.json();
  }

  /** Connectivity probe used by the federation layer before routing. */
  async probe() {
    const out = await this.query('SELECT 1');
    return { ok: true, rows: Array.isArray(out?.rows) ? out.rows.length : undefined };
  }
}
