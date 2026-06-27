import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import { ensureDB } from './utils/db.js';
import { uploadDir } from './utils/paths.js';

dotenv.config();

await ensureDB();
await fs.mkdir(uploadDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5273')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.get('/', (_req, res) => res.json({ message: 'StudyVault API is running' }));
app.get('/api/health', (_req, res) => res.json({
  ok: true,
  storage: process.env.MONGODB_URI ? 'mongodb' : 'local-json',
  uploads: process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local'
}));
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);

app.use((err, _req, res, _next) => {
  res.status(400).json({ message: err.message || 'Something went wrong.' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`StudyVault backend running on http://localhost:${PORT}`));
}

export default app;
