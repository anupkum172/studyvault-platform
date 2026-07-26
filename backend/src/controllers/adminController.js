import fs from 'fs/promises';
import path from 'path';
import { deleteCloudinaryFile } from '../utils/cloudinary.js';
import { uploadDir } from '../utils/paths.js';
import {
  deleteResourceRecord,
  findResourceById,
  getAdminData,
  updateResourceRecord
} from '../utils/store.js';

export async function adminOverview(_req, res) {
  res.json(await getAdminData());
}

export async function adminUpdateResource(req, res) {
  const resource = await findResourceById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  const updates = {};
  const allowed = ['title', 'subject', 'semester', 'branch', 'type', 'description', 'tags'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  updates.updatedAt = new Date().toISOString();

  res.json({ resource: await updateResourceRecord(req.params.id, updates) });
}

export async function adminReviewResource(req, res) {
  const resource = await findResourceById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  const { status, reviewNote = '' } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Review status must be approved or rejected.' });
  }

  const reviewedResource = await updateResourceRecord(req.params.id, {
    status,
    reviewNote,
    reviewedBy: req.user.name,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  res.json({ resource: reviewedResource });
}

export async function adminDeleteResource(req, res) {
  const resource = await findResourceById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  await deleteResourceRecord(req.params.id);
  if (resource.storageProvider === 'cloudinary') {
    await deleteCloudinaryFile(resource.publicId);
  } else {
    try {
      await fs.unlink(path.join(uploadDir, resource.fileName));
    } catch {}
  }

  res.json({ message: 'Resource removed by admin.' });
}
