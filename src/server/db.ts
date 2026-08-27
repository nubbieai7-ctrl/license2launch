/**
 * License2Launch — data layer (M1 Foundation)
 *
 * MVP persistence uses Bun's embedded SQLite at data/l2l.sqlite so the app runs
 * end-to-end with ZERO external credentials. All access is server-side only
 * (via createServerFn handlers / API routes — never from client code).
 *
 * Portability note: SQL is kept to portable ANSI-ish syntax (TEXT columns typed
 * in the mapping code, no SQLite-only features beyond journal_mode/PRAGMA which
 * are SQLite bootstrap only). The `db()` accessor is the single seam to swap
 * SQLite -> Postgres later without touching routes.
 */
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { seedIfEmpty } from "./seed";

let database: Database | null = null;
let ready: Promise<void> | null = null;

/** Path to the SQLite data file. */
export function dbPath(): string {
  return path.join(process.cwd(), "data", "l2l.sqlite");
}

/** Access the initialized DB (call initDb() first). */
export function db(): Database {
  if (!database) throw new Error("Database not initialized — call initDb() first");
  return database;
}

/** Mocked "client" accessor for a future Postgres swap. Returns null today. */
export function pg(): null {
  return null;
}

/** Ensure DB file, schema, and seed data exist. Safe to call many times. */
export async function initDb(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    const dir = path.dirname(dbPath());
    mkdirSync(dir, { recursive: true });
    const d = new Database(dbPath());
    d.exec("PRAGMA journal_mode = WAL;");
    d.exec("PRAGMA foreign_keys = ON;");
    database = d;
    migrate(d);
    await seedIfEmpty(d);
  })();
  return ready;
}

function migrate(d: Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL DEFAULT '',
      role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
      onboarding    TEXT,               -- JSON object of onboarding answers
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS professions (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      name                    TEXT NOT NULL,
      slug                    TEXT NOT NULL UNIQUE,
      category                TEXT NOT NULL DEFAULT '',
      description             TEXT NOT NULL DEFAULT '',
      typical_customers       TEXT,   -- JSON array
      required_skills         TEXT,   -- JSON array
      suggested_education     TEXT,   -- JSON array
      licenses_certifications TEXT,   -- JSON array
      exam_names              TEXT,   -- JSON array
      exam_subjects           TEXT,   -- JSON array
      business_opportunities  TEXT,   -- JSON array
      startup_cost_range      TEXT NOT NULL DEFAULT '',
      equipment_requirements  TEXT,   -- JSON array
      insurance_considerations TEXT,  -- JSON array
      revenue_models          TEXT,   -- JSON array
      typical_risks           TEXT,   -- JSON array
      marketing_channels      TEXT,   -- JSON array
      funding_options         TEXT,   -- JSON array
      employees_subcontractors TEXT,  -- JSON array
      official_links          TEXT,   -- JSON array of {label, url}
      location_requirements   TEXT NOT NULL DEFAULT '',
      last_reviewed           TEXT NOT NULL DEFAULT '',
      admin_notes             TEXT NOT NULL DEFAULT '',
      explorer_profile        TEXT,   -- JSON object for /explorer comparison
      is_sample               INTEGER NOT NULL DEFAULT 0,
      created_at              TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS business_models (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      profession_id           INTEGER NOT NULL REFERENCES professions(id) ON DELETE CASCADE,
      name                    TEXT NOT NULL,
      description             TEXT NOT NULL DEFAULT '',
      target_customers        TEXT,   -- JSON array
      services                TEXT,   -- JSON array
      startup_equipment       TEXT,   -- JSON array
      startup_cost_categories TEXT,   -- JSON array of {label, amount}
      pricing_methods         TEXT,   -- JSON array
      revenue_streams         TEXT,   -- JSON array
      insurance               TEXT,   -- JSON array
      marketing_methods       TEXT,   -- JSON array
      risks                   TEXT,   -- JSON array
      hiring_needs            TEXT,   -- JSON array
      validation_experiment   TEXT NOT NULL DEFAULT '',
      first_ten_customer_ideas TEXT,  -- JSON array
      funding_readiness       TEXT,   -- JSON array
      is_sample               INTEGER NOT NULL DEFAULT 0,
      created_at              TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS roadmap_tasks (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      profession_id          INTEGER REFERENCES professions(id) ON DELETE CASCADE, -- NULL = generic
      step_order             INTEGER NOT NULL,
      title                  TEXT NOT NULL,
      description            TEXT NOT NULL DEFAULT '',
      difficulty             TEXT NOT NULL DEFAULT 'easy',
      est_time               TEXT NOT NULL DEFAULT '',
      suggested_deadline_days INTEGER NOT NULL DEFAULT 7,
      category               TEXT NOT NULL DEFAULT 'general'
    );

    CREATE TABLE IF NOT EXISTS funding_categories (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      name                  TEXT NOT NULL UNIQUE,
      description           TEXT NOT NULL DEFAULT '',
      repayment_required    TEXT NOT NULL DEFAULT 'no',
      ownership_surrendered TEXT NOT NULL DEFAULT 'no',
      common_eligibility    TEXT,   -- JSON array
      documents_requested   TEXT,   -- JSON array
      benefits              TEXT,   -- JSON array
      risks                 TEXT,   -- JSON array
      preparation_steps     TEXT,   -- JSON array
      questions_to_ask      TEXT,   -- JSON array
      created_at            TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS practice_questions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      profession_id INTEGER NOT NULL REFERENCES professions(id) ON DELETE CASCADE,
      question      TEXT NOT NULL,
      options       TEXT NOT NULL,   -- JSON array
      correct_index INTEGER NOT NULL,
      explanation   TEXT NOT NULL DEFAULT '',
      is_sample     INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Forward migrations for DBs created before a column existed.
  // ensureColumn is idempotent — it only adds the column if it's missing.
  ensureColumn(d, "professions", "explorer_profile", "TEXT");
}

/** Add a column to a table if it does not already exist (idempotent).
 *  Column type/expression follows the ADD COLUMN syntax of the schema. */
function ensureColumn(d: Database, table: string, column: string, type: string): void {
  const cols = d
    .query(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    d.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

/** Parse a JSON column helper (arrays/objects). */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
