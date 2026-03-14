/**
 * Unified SQLite store for tools, skills, workflows, skill graph edges, and crawl queue.
 *
 * Replaces flat-file tools.json with a single SQLite database that supports:
 * - Full-text search via FTS5
 * - Vector search via sqlite-vec (optional)
 * - Hierarchical domain taxonomy
 * - Skill graph edges (io_chain, same_domain, embedding_similar, llm_inferred)
 * - Crawl queue with exponential backoff
 *
 * All operations are synchronous (better-sqlite3) but the ToolStore interface
 * is async for backward compatibility.
 */

import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSqlite, applyWalPragmas } from "./sqlite.js";
import type {
  ToolStore,
  Tool,
  StoreQuery,
  StoreQueryResult,
  InstallStatus,
} from "../types.js";
import { generateContextMd } from "../store.js";

// ── Schema ─────────────────────────────────────────────────────────────

const UNIFIED_SCHEMA = `
  -- Core tool storage (replaces tools.json)
  CREATE TABLE IF NOT EXISTS tools (
    id          TEXT PRIMARY KEY,
    meta_json   TEXT NOT NULL,        -- JSON: ToolMeta
    source_json TEXT NOT NULL,        -- JSON: ToolSource
    caps_json   TEXT NOT NULL,        -- JSON: ToolCapabilities
    install_path TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'installed',
    installed_at TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    extras_json TEXT,                 -- JSON: _curatedMeta, _readmeSections, _toolKind
    -- Denormalized fields for fast filtering/FTS
    name        TEXT NOT NULL,
    version     TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    source_format TEXT NOT NULL,
    source_uri  TEXT NOT NULL,
    tags        TEXT NOT NULL DEFAULT '' -- comma-separated
  );

  CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
  CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(name);
  CREATE INDEX IF NOT EXISTS idx_tools_format ON tools(source_format);

  -- FTS5 for tool search
  CREATE VIRTUAL TABLE IF NOT EXISTS tools_fts USING fts5(
    name,
    description,
    tags,
    content=tools,
    content_rowid=rowid
  );

  -- Triggers to keep FTS in sync
  CREATE TRIGGER IF NOT EXISTS tools_ai AFTER INSERT ON tools BEGIN
    INSERT INTO tools_fts(rowid, name, description, tags)
    VALUES (new.rowid, new.name, new.description, new.tags);
  END;

  CREATE TRIGGER IF NOT EXISTS tools_ad AFTER DELETE ON tools BEGIN
    INSERT INTO tools_fts(tools_fts, rowid, name, description, tags)
    VALUES ('delete', old.rowid, old.name, old.description, old.tags);
  END;

  CREATE TRIGGER IF NOT EXISTS tools_au AFTER UPDATE ON tools BEGIN
    INSERT INTO tools_fts(tools_fts, rowid, name, description, tags)
    VALUES ('delete', old.rowid, old.name, old.description, old.tags);
    INSERT INTO tools_fts(rowid, name, description, tags)
    VALUES (new.rowid, new.name, new.description, new.tags);
  END;

  -- Skills table (replaces .skill-cache.json + SKILL.md metadata)
  CREATE TABLE IF NOT EXISTS skills (
    id          TEXT PRIMARY KEY,     -- e.g. "src-ruff"
    tool_id     TEXT,                 -- FK to tools.id (nullable for external skills)
    domain      TEXT NOT NULL DEFAULT 'general',
    subdomain   TEXT,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    version     TEXT NOT NULL DEFAULT '0.0.0',
    tags        TEXT NOT NULL DEFAULT '',
    -- Cache fields (replaces .skill-cache.json)
    manifest_hash TEXT,
    repo_sha    TEXT,
    generated_at INTEGER,
    -- Quality scores
    trigger_score REAL,
    quality_score REAL,
    content_score REAL,
    -- Skill content path
    skill_dir   TEXT,                 -- path to SKILL.md directory
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_skills_domain ON skills(domain);
  CREATE INDEX IF NOT EXISTS idx_skills_tool ON skills(tool_id);
  CREATE INDEX IF NOT EXISTS idx_skills_quality ON skills(trigger_score);

  -- FTS5 for skill search
  CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
    name,
    description,
    tags,
    domain,
    content=skills,
    content_rowid=rowid
  );

  CREATE TRIGGER IF NOT EXISTS skills_ai AFTER INSERT ON skills BEGIN
    INSERT INTO skills_fts(rowid, name, description, tags, domain)
    VALUES (new.rowid, new.name, new.description, new.tags, new.domain);
  END;

  CREATE TRIGGER IF NOT EXISTS skills_ad AFTER DELETE ON skills BEGIN
    INSERT INTO skills_fts(skills_fts, rowid, name, description, tags, domain)
    VALUES ('delete', old.rowid, old.name, old.description, old.tags, old.domain);
  END;

  CREATE TRIGGER IF NOT EXISTS skills_au AFTER UPDATE ON skills BEGIN
    INSERT INTO skills_fts(skills_fts, rowid, name, description, tags, domain)
    VALUES ('delete', old.rowid, old.name, old.description, old.tags, old.domain);
    INSERT INTO skills_fts(rowid, name, description, tags, domain)
    VALUES (new.rowid, new.name, new.description, new.tags, new.domain);
  END;

  -- Workflows table
  CREATE TABLE IF NOT EXISTS workflows (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    domain      TEXT NOT NULL DEFAULT 'general',
    steps_json  TEXT NOT NULL,        -- JSON array of workflow steps
    env_json    TEXT,                 -- JSON: environment variables
    data_flow_json TEXT,              -- JSON: data flow edges
    estimated_duration TEXT,
    quality_json TEXT,                -- JSON: 4-axis quality scores
    skill_dir   TEXT,                 -- path to generated workflow directory
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  -- Skill graph edges
  CREATE TABLE IF NOT EXISTS skill_edges (
    source_id   TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    edge_type   TEXT NOT NULL,        -- io_chain, same_domain, embedding_similar, llm_inferred
    weight      REAL NOT NULL DEFAULT 1.0,
    metadata_json TEXT,               -- JSON: edge-specific metadata
    created_at  TEXT NOT NULL,
    PRIMARY KEY (source_id, target_id, edge_type)
  );

  CREATE INDEX IF NOT EXISTS idx_edges_source ON skill_edges(source_id);
  CREATE INDEX IF NOT EXISTS idx_edges_target ON skill_edges(target_id);
  CREATE INDEX IF NOT EXISTS idx_edges_type ON skill_edges(edge_type);

  -- Crawl queue for batch processing
  CREATE TABLE IF NOT EXISTS crawl_queue (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source      TEXT NOT NULL UNIQUE,  -- e.g. "pypi:ruff"
    registry    TEXT NOT NULL,         -- pypi, npm, crates, github, mcp
    priority    INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, done, failed
    attempts    INTEGER NOT NULL DEFAULT 0,
    last_error  TEXT,
    next_retry_at INTEGER,            -- unix timestamp for exponential backoff
    metadata_json TEXT,               -- JSON: cursor, extra info from seeder
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_crawl_status ON crawl_queue(status, next_retry_at);
  CREATE INDEX IF NOT EXISTS idx_crawl_registry ON crawl_queue(registry);

  -- Domain taxonomy (hierarchical)
  CREATE TABLE IF NOT EXISTS domains (
    id          TEXT PRIMARY KEY,     -- e.g. "ai-ml/llm-inference"
    parent_id   TEXT,                 -- FK to domains.id
    label       TEXT NOT NULL,        -- human-readable label
    trigger_phrase TEXT NOT NULL DEFAULT '',
    depth       INTEGER NOT NULL DEFAULT 0,
    tool_count  INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES domains(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_domains_parent ON domains(parent_id);

  -- Schema version tracking
  CREATE TABLE IF NOT EXISTS schema_version (
    version     INTEGER PRIMARY KEY,
    applied_at  TEXT NOT NULL
  );
`;

// ── Tool serialization helpers ─────────────────────────────────────────

function toolToRow(tool: Tool): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  if (tool._curatedMeta) extras.curatedMeta = tool._curatedMeta;
  if (tool._readmeSections) extras.readmeSections = tool._readmeSections;
  if (tool._toolKind) extras.toolKind = tool._toolKind;

  return {
    id: tool.id,
    meta_json: JSON.stringify(tool.meta),
    source_json: JSON.stringify(tool.source),
    caps_json: JSON.stringify(tool.capabilities),
    install_path: tool.installPath,
    status: tool.status,
    installed_at: tool.installedAt,
    updated_at: tool.updatedAt,
    extras_json: Object.keys(extras).length > 0 ? JSON.stringify(extras) : null,
    name: tool.meta.name,
    version: tool.meta.version,
    description: tool.meta.description,
    source_format: tool.source.format,
    source_uri: tool.source.uri,
    tags: (tool.meta.tags as string[]).join(","),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTool(row: any): Tool {
  const meta = JSON.parse(row.meta_json);
  const source = JSON.parse(row.source_json);
  const capabilities = JSON.parse(row.caps_json);
  const extras = row.extras_json ? JSON.parse(row.extras_json) : {};

  const tool: Tool = {
    id: row.id,
    meta,
    source,
    capabilities,
    installPath: row.install_path,
    status: row.status as InstallStatus,
    installedAt: row.installed_at,
    updatedAt: row.updated_at,
  };

  // Attach optional fields
  if (extras.curatedMeta) {
    Object.defineProperty(tool, "_curatedMeta", { value: extras.curatedMeta, enumerable: true });
  }
  if (extras.readmeSections) {
    Object.defineProperty(tool, "_readmeSections", { value: extras.readmeSections, enumerable: true });
  }
  if (extras.toolKind) {
    Object.defineProperty(tool, "_toolKind", { value: extras.toolKind, enumerable: true });
  }

  return tool;
}

// ── Validate tool ID ───────────────────────────────────────────────────

function validateToolId(id: string): void {
  if (!id || id.includes("..") || /[\x00-\x1f]/.test(id) || /^[/\\]/.test(id)) {
    throw new Error(`Invalid tool ID: ${id}`);
  }
}

// ── UnifiedStore class ─────────────────────────────────────────────────

export class UnifiedStore implements ToolStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any;
  private readonly toolsDir: string;
  private readonly dbPath: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stmtGet: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stmtInsert: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stmtDelete: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stmtHas: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stmtSkillUpsert: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stmtGetNeighborsAll: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stmtGetNeighborsTyped: any;

  constructor(dataDir: string) {
    this.toolsDir = join(dataDir, "tools");
    this.dbPath = join(dataDir, "agents.sqlite");

    mkdirSync(dataDir, { recursive: true });
    mkdirSync(this.toolsDir, { recursive: true });

    const Database = getSqlite();
    this.db = new Database(this.dbPath);
    applyWalPragmas(this.db);
    this.db.exec(UNIFIED_SCHEMA);

    // Set schema version
    const currentVersion = this.db
      .prepare("SELECT MAX(version) as v FROM schema_version")
      .get();
    if (!currentVersion?.v) {
      this.db
        .prepare("INSERT INTO schema_version (version, applied_at) VALUES (?, ?)")
        .run(1, new Date().toISOString());
    }

    // Prepare frequently-used statements
    this.stmtGet = this.db.prepare("SELECT * FROM tools WHERE id = ?");
    this.stmtInsert = this.db.prepare(`
      INSERT OR REPLACE INTO tools
        (id, meta_json, source_json, caps_json, install_path, status,
         installed_at, updated_at, extras_json, name, version, description,
         source_format, source_uri, tags)
      VALUES
        (@id, @meta_json, @source_json, @caps_json, @install_path, @status,
         @installed_at, @updated_at, @extras_json, @name, @version, @description,
         @source_format, @source_uri, @tags)
    `);
    this.stmtDelete = this.db.prepare("DELETE FROM tools WHERE id = ?");
    this.stmtHas = this.db.prepare("SELECT 1 FROM tools WHERE id = ? LIMIT 1");

    // Skill statements
    this.stmtSkillUpsert = this.db.prepare(`
      INSERT OR REPLACE INTO skills
        (id, tool_id, domain, subdomain, name, description, version, tags,
         manifest_hash, repo_sha, generated_at, trigger_score, quality_score,
         content_score, skill_dir)
      VALUES
        (@id, @tool_id, @domain, @subdomain, @name, @description, @version, @tags,
         @manifest_hash, @repo_sha, @generated_at, @trigger_score, @quality_score,
         @content_score, @skill_dir)
    `);
    this.stmtGetNeighborsAll = this.db.prepare("SELECT target_id as id, weight, edge_type as edgeType FROM skill_edges WHERE source_id = ?");
    this.stmtGetNeighborsTyped = this.db.prepare("SELECT target_id as id, weight, edge_type as edgeType FROM skill_edges WHERE source_id = ? AND edge_type = ?");
  }

  // ── ToolStore interface ────────────────────────────────────────────

  async get(id: string): Promise<Tool | null> {
    const row = this.stmtGet.get(id);
    return row ? rowToTool(row) : null;
  }

  async list(query?: StoreQuery): Promise<StoreQueryResult> {
    const conditions: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];

    if (query?.status) {
      conditions.push("status = ?");
      params.push(query.status);
    }

    if (query?.tags && query.tags.length > 0) {
      // Match any tag (comma-separated tags field)
      const tagClauses = (query.tags as string[]).map(() => "tags LIKE ?");
      conditions.push(`(${tagClauses.join(" OR ")})`);
      for (const tag of query.tags) {
        params.push(`%${tag}%`);
      }
    }

    if (query?.text) {
      // Use FTS5 for text search if available
      conditions.push("id IN (SELECT id FROM tools WHERE name LIKE ? OR description LIKE ?)");
      params.push(`%${query.text}%`, `%${query.text}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countRow = this.db.prepare(`SELECT COUNT(*) as c FROM tools ${where}`).get(...params);
    const total = countRow?.c ?? 0;

    // Get paginated results
    const offset = query?.offset ?? 0;
    const limit = query?.limit ?? total;
    const rows = this.db
      .prepare(`SELECT * FROM tools ${where} ORDER BY name LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools = rows.map((row: any) => rowToTool(row));
    return { tools, total };
  }

  async save(tool: Tool): Promise<void> {
    validateToolId(tool.id);
    const row = toolToRow(tool);
    this.stmtInsert.run(row);

    // Write CONTEXT.md alongside the tool
    const contextDir = join(this.toolsDir, tool.id);
    mkdirSync(contextDir, { recursive: true });
    writeFileSync(join(contextDir, "CONTEXT.md"), generateContextMd(tool), "utf-8");
  }

  async remove(id: string): Promise<boolean> {
    validateToolId(id);
    const result = this.stmtDelete.run(id);
    if (result.changes > 0) {
      const toolDir = join(this.toolsDir, id);
      if (existsSync(toolDir)) {
        const { rmSync } = await import("node:fs");
        rmSync(toolDir, { recursive: true, force: true });
      }
      return true;
    }
    return false;
  }

  async has(id: string): Promise<boolean> {
    return !!this.stmtHas.get(id);
  }

  // ── Bulk operations (not in ToolStore interface) ───────────────────

  /** Bulk insert tools in a transaction (for migration) */
  bulkInsert(tools: Tool[]): number {
    const tx = this.db.transaction((items: Tool[]) => {
      for (const tool of items) {
        const row = toolToRow(tool);
        this.stmtInsert.run(row);
      }
    });
    tx(tools);
    return tools.length;
  }

  /** Full-text search across tools using FTS5 */
  searchTools(query: string, limit = 25): Tool[] {
    const rows = this.db
      .prepare(`
        SELECT t.* FROM tools t
        JOIN tools_fts f ON t.rowid = f.rowid
        WHERE tools_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `)
      .all(query, limit);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((row: any) => rowToTool(row));
  }

  /** Get tool count */
  count(): number {
    const row = this.db.prepare("SELECT COUNT(*) as c FROM tools").get();
    return row?.c ?? 0;
  }

  // ── Skills table operations ────────────────────────────────────────

  /** Upsert a skill record */
  upsertSkill(skill: SkillRecord): void {
    this.stmtSkillUpsert.run(skill);
  }

  /** Bulk upsert skills in a transaction */
  bulkUpsertSkills(skills: SkillRecord[]): number {
    const tx = this.db.transaction((items: SkillRecord[]) => {
      for (const s of items) this.stmtSkillUpsert.run(s);
    });
    tx(skills);
    return skills.length;
  }

  /** Get a skill by ID */
  getSkill(id: string): SkillRecord | null {
    return this.db.prepare("SELECT * FROM skills WHERE id = ?").get(id) ?? null;
  }

  /** Check skill cache (replaces SkillCache.get) */
  getSkillCache(id: string): { manifest_hash: string; repo_sha: string; generated_at: number } | null {
    const row = this.db
      .prepare("SELECT manifest_hash, repo_sha, generated_at FROM skills WHERE id = ?")
      .get(id);
    return row ?? null;
  }

  /** List skills with optional domain filter */
  listSkills(opts?: { domain?: string; minTrigger?: number; limit?: number; offset?: number }): SkillRecord[] {
    const conditions: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];

    if (opts?.domain) {
      conditions.push("domain = ?");
      params.push(opts.domain);
    }
    if (opts?.minTrigger !== undefined) {
      conditions.push("trigger_score >= ?");
      params.push(opts.minTrigger);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = opts?.limit ?? 1000;
    const offset = opts?.offset ?? 0;

    return this.db
      .prepare(`SELECT * FROM skills ${where} ORDER BY name LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);
  }

  /** Search skills using FTS5 */
  searchSkills(query: string, limit = 25): SkillRecord[] {
    return this.db
      .prepare(`
        SELECT s.* FROM skills s
        JOIN skills_fts f ON s.rowid = f.rowid
        WHERE skills_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `)
      .all(query, limit);
  }

  /** Get skill count */
  skillCount(domain?: string): number {
    if (domain) {
      const row = this.db.prepare("SELECT COUNT(*) as c FROM skills WHERE domain = ?").get(domain);
      return row?.c ?? 0;
    }
    const row = this.db.prepare("SELECT COUNT(*) as c FROM skills").get();
    return row?.c ?? 0;
  }

  // ── Skill edges ────────────────────────────────────────────────────

  /** Add a skill graph edge */
  addEdge(sourceId: string, targetId: string, edgeType: EdgeType, weight = 1.0, metadata?: Record<string, unknown>): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO skill_edges (source_id, target_id, edge_type, weight, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sourceId, targetId, edgeType, weight, metadata ? JSON.stringify(metadata) : null, new Date().toISOString());
  }

  /** Bulk insert edges in a transaction */
  bulkAddEdges(edges: Array<{ sourceId: string; targetId: string; edgeType: EdgeType; weight?: number; metadata?: Record<string, unknown> }>): number {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO skill_edges (source_id, target_id, edge_type, weight, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    const tx = this.db.transaction((items: typeof edges) => {
      for (const e of items) {
        stmt.run(e.sourceId, e.targetId, e.edgeType, e.weight ?? 1.0, e.metadata ? JSON.stringify(e.metadata) : null, now);
      }
    });
    tx(edges);
    return edges.length;
  }

  /** Get neighbors of a skill */
  getNeighbors(skillId: string, edgeType?: EdgeType): Array<{ id: string; weight: number; edgeType: string }> {
    return edgeType
      ? this.stmtGetNeighborsTyped.all(skillId, edgeType)
      : this.stmtGetNeighborsAll.all(skillId);
  }

  /** Get edge count */
  edgeCount(): number {
    const row = this.db.prepare("SELECT COUNT(*) as c FROM skill_edges").get();
    return row?.c ?? 0;
  }

  // ── Crawl queue ────────────────────────────────────────────────────

  /** Enqueue a source for crawling */
  enqueue(source: string, registry: string, priority = 0, metadata?: Record<string, unknown>): void {
    const now = Date.now();
    this.db.prepare(`
      INSERT OR IGNORE INTO crawl_queue (source, registry, priority, status, attempts, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', 0, ?, ?, ?)
    `).run(source, registry, priority, metadata ? JSON.stringify(metadata) : null, now, now);
  }

  /** Bulk enqueue sources */
  bulkEnqueue(items: Array<{ source: string; registry: string; priority?: number; metadata?: Record<string, unknown> }>): number {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO crawl_queue (source, registry, priority, status, attempts, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', 0, ?, ?, ?)
    `);
    const now = Date.now();
    let inserted = 0;
    const tx = this.db.transaction((batch: typeof items) => {
      for (const item of batch) {
        const result = stmt.run(item.source, item.registry, item.priority ?? 0, item.metadata ? JSON.stringify(item.metadata) : null, now, now);
        if (result.changes > 0) inserted++;
      }
    });
    tx(items);
    return inserted;
  }

  /** Dequeue the next item(s) for processing (atomic SELECT+UPDATE in transaction) */
  dequeue(limit = 1): CrawlQueueItem[] {
    const now = Date.now();
    const tx = this.db.transaction(() => {
      const rows = this.db.prepare(`
        SELECT * FROM crawl_queue
        WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= ?)
        ORDER BY priority DESC, created_at ASC
        LIMIT ?
      `).all(now, limit);

      if (rows.length === 0) return [];

      // Mark as processing
      const ids = rows.map((r: CrawlQueueItem) => r.id);
      const placeholders = ids.map(() => "?").join(",");
      this.db.prepare(`UPDATE crawl_queue SET status = 'processing', updated_at = ? WHERE id IN (${placeholders})`).run(now, ...ids);

      return rows;
    });
    return tx();
  }

  /** Mark a crawl item as done */
  markDone(id: number): void {
    this.db.prepare("UPDATE crawl_queue SET status = 'done', updated_at = ? WHERE id = ?").run(Date.now(), id);
  }

  /** Mark a crawl item as failed with exponential backoff */
  markFailed(id: number, error: string): void {
    const now = Date.now();
    const row = this.db.prepare("SELECT attempts FROM crawl_queue WHERE id = ?").get(id);
    const attempts = (row?.attempts ?? 0) + 1;
    // Exponential backoff: 1min, 5min, 30min
    const backoffMs = [60_000, 300_000, 1_800_000][Math.min(attempts - 1, 2)] ?? 1_800_000;
    const nextRetry = now + backoffMs;

    this.db.prepare(`
      UPDATE crawl_queue SET status = 'failed', attempts = ?, last_error = ?, next_retry_at = ?, updated_at = ?
      WHERE id = ?
    `).run(attempts, error, nextRetry, now, id);

    // After max retries (3), leave as failed permanently
    if (attempts < 3) {
      this.db.prepare("UPDATE crawl_queue SET status = 'pending' WHERE id = ?").run(id);
    }
  }

  /** Get crawl queue stats */
  crawlStats(): { pending: number; processing: number; done: number; failed: number } {
    const rows = this.db.prepare("SELECT status, COUNT(*) as c FROM crawl_queue GROUP BY status").all();
    const stats = { pending: 0, processing: 0, done: 0, failed: 0 };
    for (const row of rows) {
      if (row.status in stats) {
        stats[row.status as keyof typeof stats] = row.c;
      }
    }
    return stats;
  }

  // ── Domain taxonomy ────────────────────────────────────────────────

  /** Upsert a domain */
  upsertDomain(id: string, label: string, triggerPhrase: string, parentId?: string, depth = 0): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO domains (id, parent_id, label, trigger_phrase, depth, tool_count)
      VALUES (?, ?, ?, ?, ?, COALESCE((SELECT tool_count FROM domains WHERE id = ?), 0))
    `).run(id, parentId ?? null, label, triggerPhrase, depth, id);
  }

  /** Get domain by ID */
  getDomain(id: string): DomainRecord | null {
    return this.db.prepare("SELECT * FROM domains WHERE id = ?").get(id) ?? null;
  }

  /** Get child domains */
  getChildDomains(parentId: string): DomainRecord[] {
    return this.db.prepare("SELECT * FROM domains WHERE parent_id = ? ORDER BY label").all(parentId);
  }

  /** Get all domains */
  listDomains(): DomainRecord[] {
    return this.db.prepare("SELECT * FROM domains ORDER BY id").all();
  }

  /** Update domain tool count */
  updateDomainCount(domainId: string): void {
    const row = this.db.prepare("SELECT COUNT(*) as c FROM skills WHERE domain = ?").get(domainId);
    this.db.prepare("UPDATE domains SET tool_count = ? WHERE id = ?").run(row?.c ?? 0, domainId);
  }

  // ── Workflows ──────────────────────────────────────────────────────

  /** Upsert a workflow */
  upsertWorkflow(workflow: WorkflowRecord): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO workflows
        (id, name, description, domain, steps_json, env_json, data_flow_json,
         estimated_duration, quality_json, skill_dir, created_at, updated_at)
      VALUES
        (@id, @name, @description, @domain, @steps_json, @env_json, @data_flow_json,
         @estimated_duration, @quality_json, @skill_dir, @created_at, @updated_at)
    `).run(workflow);
  }

  /** Get workflow by ID */
  getWorkflow(id: string): WorkflowRecord | null {
    return this.db.prepare("SELECT * FROM workflows WHERE id = ?").get(id) ?? null;
  }

  /** List workflows */
  listWorkflows(opts?: { domain?: string; limit?: number }): WorkflowRecord[] {
    if (opts?.domain) {
      return this.db.prepare("SELECT * FROM workflows WHERE domain = ? ORDER BY name LIMIT ?")
        .all(opts.domain, opts?.limit ?? 100);
    }
    return this.db.prepare("SELECT * FROM workflows ORDER BY name LIMIT ?")
      .all(opts?.limit ?? 100);
  }

  /** Get workflow count */
  workflowCount(): number {
    const row = this.db.prepare("SELECT COUNT(*) as c FROM workflows").get();
    return row?.c ?? 0;
  }

  // ── Marketplace query methods ────────────────────────────────────

  /** Search across skills + workflows with pagination, FTS, and filters */
  searchProducts(opts?: {
    q?: string;
    offset?: number;
    limit?: number;
    domain?: string[];
    productType?: string[];
    minQuality?: number;
    sort?: "name" | "quality" | "newest";
  }): { products: Array<Record<string, unknown>>; total: number; offset: number; limit: number; hasMore: boolean } {
    const off = opts?.offset ?? 0;
    const lim = opts?.limit ?? 50;

    const includeSkills = !opts?.productType?.length || opts.productType.some((t) => t === "skill" || t === "all");
    const includeWorkflows = !opts?.productType?.length || opts.productType.some((t) => t === "workflow" || t === "all");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allParams: any[] = [];
    const parts: string[] = [];

    if (includeSkills) {
      const conds: string[] = [];
      if (opts?.q) { conds.push("s.id IN (SELECT id FROM skills_fts WHERE skills_fts MATCH ?)"); allParams.push(opts.q); }
      if (opts?.domain?.length) { conds.push(`s.domain IN (${opts.domain.map(() => "?").join(",")})`); allParams.push(...opts.domain); }
      if (opts?.minQuality !== undefined) { conds.push("s.trigger_score >= ?"); allParams.push(opts.minQuality); }
      const w = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
      parts.push(`SELECT s.id, s.name, s.description, s.domain, 'skill' as product_type, s.trigger_score as quality, s.version, s.tags, s.skill_dir, NULL as steps_json, NULL as estimated_duration, s.rowid as _rowid FROM skills s ${w}`);
    }

    if (includeWorkflows) {
      const conds: string[] = [];
      if (opts?.q) { conds.push("(w.name LIKE ? OR w.description LIKE ?)"); allParams.push(`%${opts.q}%`, `%${opts.q}%`); }
      if (opts?.domain?.length) { conds.push(`w.domain IN (${opts.domain.map(() => "?").join(",")})`); allParams.push(...opts.domain); }
      const w = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
      parts.push(`SELECT w.id, w.name, w.description, w.domain, 'workflow' as product_type, NULL as quality, '1.0.0' as version, '' as tags, w.skill_dir, w.steps_json, w.estimated_duration, w.rowid as _rowid FROM workflows w ${w}`);
    }

    if (!parts.length) return { products: [], total: 0, offset: off, limit: lim, hasMore: false };

    const unionSql = parts.join(" UNION ALL ");
    const sortClause = opts?.sort === "quality" ? "ORDER BY quality DESC NULLS LAST" : opts?.sort === "newest" ? "ORDER BY _rowid DESC" : "ORDER BY name ASC";

    // Count
    const countSql = `SELECT COUNT(*) as c FROM (${unionSql})`;
    const countParams = [...allParams];
    const total = this.db.prepare(countSql).get(...countParams)?.c ?? 0;

    // Paginated results
    const pageSql = `${unionSql} ${sortClause} LIMIT ? OFFSET ?`;
    allParams.push(lim, off);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = this.db.prepare(pageSql).all(...allParams);

    const products = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      domain: r.domain,
      productType: r.product_type,
      quality: r.quality,
      version: r.version,
      tags: r.tags ? String(r.tags as string).split(",").filter(Boolean) : [],
      skillDir: r.skill_dir,
      steps: r.steps_json ? JSON.parse(r.steps_json as string) : undefined,
      estimatedDuration: r.estimated_duration,
    }));

    return { products, total, offset: off, limit: lim, hasMore: off + lim < total };
  }

  /** List domains with skill + workflow counts as a tree */
  listDomainsWithCounts(): Array<{ id: string; label: string; parentId: string | null; depth: number; skillCount: number; workflowCount: number; total: number }> {
    const domains = this.listDomains();
    return domains.map((d) => {
      const skillCount = this.db.prepare("SELECT COUNT(*) as c FROM skills WHERE domain = ?").get(d.id)?.c ?? 0;
      const workflowCount = this.db.prepare("SELECT COUNT(*) as c FROM workflows WHERE domain = ?").get(d.id)?.c ?? 0;
      return {
        id: d.id,
        label: d.label,
        parentId: d.parent_id,
        depth: d.depth,
        skillCount,
        workflowCount,
        total: skillCount + workflowCount,
      };
    });
  }

  // ── General ────────────────────────────────────────────────────────

  /** Get the underlying database (for advanced queries / sqlite-vec) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDb(): any {
    return this.db;
  }

  /** Get the database file path */
  getDbPath(): string {
    return this.dbPath;
  }

  /** Close the database connection */
  close(): void {
    this.db.close();
  }

  /** Get comprehensive stats */
  stats(): StoreStats {
    return {
      tools: this.count(),
      skills: this.skillCount(),
      workflows: this.workflowCount(),
      edges: this.edgeCount(),
      crawl: this.crawlStats(),
      domains: this.db.prepare("SELECT COUNT(*) as c FROM domains").get()?.c ?? 0,
    };
  }
}

// ── Types ──────────────────────────────────────────────────────────────

export interface SkillRecord {
  id: string;
  tool_id: string | null;
  domain: string;
  subdomain: string | null;
  name: string;
  description: string;
  version: string;
  tags: string;
  manifest_hash: string | null;
  repo_sha: string | null;
  generated_at: number | null;
  trigger_score: number | null;
  quality_score: number | null;
  content_score: number | null;
  skill_dir: string | null;
}

export interface WorkflowRecord {
  id: string;
  name: string;
  description: string;
  domain: string;
  steps_json: string;
  env_json: string | null;
  data_flow_json: string | null;
  estimated_duration: string | null;
  quality_json: string | null;
  skill_dir: string | null;
  created_at: string;
  updated_at: string;
}

export interface DomainRecord {
  id: string;
  parent_id: string | null;
  label: string;
  trigger_phrase: string;
  depth: number;
  tool_count: number;
}

export type CrawlStatus = "pending" | "processing" | "done" | "failed";

export interface CrawlQueueItem {
  id: number;
  source: string;
  registry: string;
  priority: number;
  status: CrawlStatus;
  attempts: number;
  last_error: string | null;
  next_retry_at: number | null;
  metadata_json: string | null;
  created_at: number;
  updated_at: number;
}

export type EdgeType = "io_chain" | "same_domain" | "embedding_similar" | "llm_inferred";

export interface StoreStats {
  tools: number;
  skills: number;
  workflows: number;
  edges: number;
  crawl: { pending: number; processing: number; done: number; failed: number };
  domains: number;
}

// ── Factory ────────────────────────────────────────────────────────────

let _store: UnifiedStore | null = null;

/** Initialize the unified store (must call ensureSqlite() first) */
export function createUnifiedStore(dataDir: string): UnifiedStore {
  if (_store) {
    const expectedPath = join(dataDir, "agents.sqlite");
    if (_store.getDbPath() !== expectedPath) {
      _store.close();
      _store = new UnifiedStore(dataDir);
    }
    return _store;
  }
  _store = new UnifiedStore(dataDir);
  return _store;
}

/** Get the singleton store (throws if not initialized) */
export function getUnifiedStore(): UnifiedStore {
  if (!_store) throw new Error("Call createUnifiedStore() first");
  return _store;
}

/** Close and reset the singleton store */
export function closeUnifiedStore(): void {
  _store?.close();
  _store = null;
}
