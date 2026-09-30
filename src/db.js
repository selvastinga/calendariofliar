import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR);

const db = new DatabaseSync(path.join(DATA_DIR, 'calendario.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    location TEXT,
    description TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

export function insertEvent({ title, eventDate, location, description, createdBy }) {
  const stmt = db.prepare(`
    INSERT INTO events (title, event_date, location, description, created_by)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(title, eventDate, location ?? null, description ?? null, createdBy ?? null);
  return Number(result.lastInsertRowid);
}

export function listEvents({ from, to } = {}) {
  if (from && to) {
    return db
      .prepare('SELECT * FROM events WHERE event_date BETWEEN ? AND ? ORDER BY event_date ASC')
      .all(from, to);
  }
  return db.prepare('SELECT * FROM events ORDER BY event_date ASC').all();
}

export function listUpcomingEvents(limit = 5) {
  const nowIso = new Date().toISOString();
  return db
    .prepare('SELECT * FROM events WHERE event_date >= ? ORDER BY event_date ASC LIMIT ?')
    .all(nowIso, limit);
}

export function deleteEvent(id) {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}

export function updateEvent(id, { title, eventDate, location, description }) {
  const result = db
    .prepare(
      'UPDATE events SET title = ?, event_date = ?, location = ?, description = ? WHERE id = ?'
    )
    .run(title, eventDate, location ?? null, description ?? null, id);
  return Number(result.changes) > 0;
}

export default db;
