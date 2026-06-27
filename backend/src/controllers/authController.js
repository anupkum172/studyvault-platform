import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { createUser, findUserByEmail, findUserById, updateUser } from '../utils/store.js';

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

  const exists = await findUserByEmail(email);
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

  const createdUser = await createUser(user);
  res.status(201).json({ user: publicUser(createdUser), token: createToken(createdUser.id) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  res.json({ user: publicUser(user), token: createToken(user.id) });
}

export async function me(req, res) {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: publicUser(user) });
}

export async function updateProfile(req, res) {
  const { name, branch, semester, bio } = req.body;
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const updatedUser = await updateUser(req.user.id, {
    name: name || user.name,
    branch: branch || user.branch,
    semester: semester || user.semester,
    bio: bio ?? user.bio
  });
  res.json({ user: publicUser(updatedUser) });
}
