import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let db: Database.Database | null = null

function getMigrationsDir(): string {
  const candidates = [
    path.join(__dirname, 'migrations'),
    path.join(process.cwd(), 'src/main/db/migrations'),
    path.join(app.getAppPath(), 'src/main/db/migrations'),
  ]
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir
  }
  throw new Error(`Migrations directory not found. Tried: ${candidates.join(', ')}`)
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `)

  const migrationsDir = getMigrationsDir()
  const files = fs.readdirSync(migrationsDir).sort()

  for (const file of files) {
    if (!file.endsWith('.sql')) continue
    const applied = database
      .prepare('SELECT id FROM _migrations WHERE id = ?')
      .get(file)
    if (applied) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    database.exec(sql)
    database
      .prepare('INSERT INTO _migrations (id, applied_at) VALUES (?, ?)')
      .run(file, Date.now())
  }
}

export function getDatabase(): Database.Database {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'copilot.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  return db
}

export function closeDatabase(): void {
  db?.close()
  db = null
}
