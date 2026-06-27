import jwt from 'jsonwebtoken';
import { findUserById } from '../utils/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'studyvault_dev_secret_change_me';

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized. Token missing.' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);

    if (!user) return res.status(401).json({ message: 'User not found.' });

    req.user = { id: user.id, name: user.name, email: user.email, branch: user.branch, semester: user.semester };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}
