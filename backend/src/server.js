import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';

dotenv.config();

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('data')) fs.mkdirSync('data');
if (!fs.existsSync('data/db.json')) fs.writeFileSync('data/db.json', JSON.stringify({ users: [], resources: [] }, null, 2));

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5273')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (_req, res) => res.json({ message: 'StudyVault API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);

app.use((err, _req, res, _next) => {
  res.status(400).json({ message: err.message || 'Something went wrong.' });
});

app.listen(PORT, () => console.log(`StudyVault backend running on http://localhost:${PORT}`));
