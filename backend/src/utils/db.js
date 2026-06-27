import fs from 'fs/promises';
import path from 'path';
import { dataDir } from './paths.js';

const dbPath = path.join(dataDir, 'db.json');
const emptyDB = { users: [], resources: [] };

export async function ensureDB() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(emptyDB, null, 2));
  }
}

export async function readDB() {
  await ensureDB();
  const raw = await fs.readFile(dbPath, 'utf-8');
  return JSON.parse(raw);
}

export async function writeDB(data) {
  await ensureDB();
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}
