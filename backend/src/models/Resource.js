import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  semester: { type: String, required: true },
  branch: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, default: '' },
  tags: { type: String, default: '' },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileUrl: { type: String, default: '' },
  storageProvider: { type: String, default: 'local' },
  publicId: { type: String, default: '' },
  resourceType: { type: String, default: '' },
  ownerId: { type: String, required: true, index: true },
  ownerName: { type: String, required: true },
  downloads: { type: Number, default: 0 },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
});

export const Resource = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);
