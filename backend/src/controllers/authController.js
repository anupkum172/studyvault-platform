import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { createUser, findUserByEmail, findUserById, updateUser } from '../utils/store.js';
import { resolveRole } from '../utils/admin.js';
import { hasEmailProvider, sendPasswordResetEmail } from '../utils/email.js';

const JWT_SECRET = process.env.JWT_SECRET || 'studyvault_dev_secret_change_me';

function createToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  const { password, resetCodeHash, resetCodeExpiresAt, ...safeUser } = user;
  return { ...safeUser, role: resolveRole(user) };
}

function createResetCode() {
  return crypto.randomInt(100000, 999999).toString();
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
    role: 'user',
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

export async function requestPasswordReset(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const user = await findUserByEmail(email);
  if (!user) {
    return res.json({ message: 'If this email exists, a verification code has been sent.' });
  }

  if (!hasEmailProvider && process.env.VERCEL) {
    return res.status(503).json({
      message: 'Email password reset is not configured. Add RESEND_API_KEY and EMAIL_FROM in Vercel.'
    });
  }

  const resetCode = createResetCode();
  await updateUser(user.id, {
    resetCodeHash: await bcrypt.hash(resetCode, 10),
    resetCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  });

  if (hasEmailProvider) {
    await sendPasswordResetEmail({ to: user.email, name: user.name, code: resetCode });
    return res.json({ message: 'A verification code has been sent to your email. It expires in 15 minutes.' });
  }

  return res.json({
    message: 'Development mode: use this verification code within 15 minutes.',
    devResetCode: resetCode
  });
}

export async function resetPassword(req, res) {
  const { email, code, password } = req.body;
  if (!email || !code || !password) {
    return res.status(400).json({ message: 'Email, reset code and new password are required.' });
  }
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  const user = await findUserByEmail(email);
  if (!user || !user.resetCodeHash || !user.resetCodeExpiresAt) {
    return res.status(400).json({ message: 'Invalid or expired reset code.' });
  }
  if (new Date(user.resetCodeExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({ message: 'Reset code expired. Request a new code.' });
  }
  if (!(await bcrypt.compare(String(code), user.resetCodeHash))) {
    return res.status(400).json({ message: 'Invalid reset code.' });
  }

  await updateUser(user.id, {
    password: await bcrypt.hash(password, 10),
    resetCodeHash: '',
    resetCodeExpiresAt: ''
  });

  res.json({ message: 'Password updated successfully. You can now sign in.' });
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
