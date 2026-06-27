import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  branch: { type: String, default: 'Computer Science' },
  semester: { type: String, default: '4' },
  bio: { type: String, default: 'I use StudyVault to organize and share academic resources.' },
  createdAt: { type: String, required: true }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
