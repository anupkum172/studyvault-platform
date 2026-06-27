import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');
const runtimeRoot = process.env.VERCEL ? path.join(os.tmpdir(), 'studyvault') : projectRoot;

export const dataDir = process.env.DATA_DIR || path.join(runtimeRoot, 'data');
export const uploadDir = process.env.UPLOAD_DIR || path.join(runtimeRoot, 'uploads');
