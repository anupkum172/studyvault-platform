import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { readDB, writeDB } from '../utils/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'studyvault_dev_secret_change_me';

function createToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function register(req, res) {
  const { name, email, password, branch = 'Computer Science', semester = '4' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  const db = await readDB();
  const exists = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ message: 'Email already registered.' });

  const user = {
    id: nanoid(),
    name,
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, 10),
    branch,
    semester,
    bio: 'I use StudyVault to organize and share academic resources.',
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  await writeDB(db);
  res.status(201).json({ user: publicUser(user), token: createToken(user.id) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const db = await readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  res.json({ user: publicUser(user), token: createToken(user.id) });
}

export async function me(req, res) {
  const db = await readDB();
  const user = db.users.find((u) => u.id === req.user.id);
  res.json({ user: publicUser(user) });
}

export async function updateProfile(req, res) {
  const { name, branch, semester, bio } = req.body;
  const db = await readDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  user.name = name || user.name;
  user.branch = branch || user.branch;
  user.semester = semester || user.semester;
  user.bio = bio ?? user.bio;
  await writeDB(db);
  res.json({ user: publicUser(user) });
}
