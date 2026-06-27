import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { uploadDir } from '../utils/paths.js';
import { deleteCloudinaryFile, hasCloudinary, uploadBuffer } from '../utils/cloudinary.js';
import {
  createResourceRecord,
  deleteResourceRecord,
  findResourceById,
  getDashboardData,
  listResources,
  updateResourceRecord
} from '../utils/store.js';

export async function getResources(req, res) {
  const { q = '', semester = '', subject = '', type = '', branch = '' } = req.query;
  const resources = await listResources({ q, semester, subject, type, branch }, req.user?.id);
  res.json({ resources });
}

export async function createResource(req, res) {
  const { title, subject, semester, branch, type, description = '', tags = '' } = req.body;
  if (!title || !subject || !semester || !branch || !type) {
    return res.status(400).json({ message: 'Title, subject, semester, branch and type are required.' });
  }
  if (process.env.VERCEL && !hasCloudinary) {
    return res.status(503).json({ message: 'Uploads need Cloudinary on Vercel. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, then redeploy.' });
  }
  if (!req.file) return res.status(400).json({ message: 'File is required.' });

  let cloudinaryFile = null;
  if (hasCloudinary) {
    try {
      cloudinaryFile = await uploadBuffer(req.file.buffer, req.file.originalname);
    } catch (error) {
      return res.status(502).json({
        message: `Cloudinary upload failed: ${error.message}. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.`
      });
    }
  }

  const resource = {
    id: nanoid(),
    title,
    subject,
    semester,
    branch,
    type,
    description,
    tags,
    fileName: req.file.filename || cloudinaryFile?.public_id || req.file.originalname,
    originalName: req.file.originalname,
    fileSize: req.file.size,
    fileUrl: cloudinaryFile?.secure_url || '',
    storageProvider: cloudinaryFile ? 'cloudinary' : 'local',
    publicId: cloudinaryFile?.public_id || '',
    ownerId: req.user.id,
    ownerName: req.user.name,
    downloads: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({ resource: await createResourceRecord(resource) });
}

export async function updateResource(req, res) {
  const resource = await findResourceById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  if (resource.ownerId !== req.user.id) return res.status(403).json({ message: 'You can edit only your own resource.' });

  const updates = {};
  const allowed = ['title', 'subject', 'semester', 'branch', 'type', 'description', 'tags'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  updates.updatedAt = new Date().toISOString();
  res.json({ resource: await updateResourceRecord(req.params.id, updates) });
}

export async function deleteResource(req, res) {
  const resource = await findResourceById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  if (resource.ownerId !== req.user.id) return res.status(403).json({ message: 'You can delete only your own resource.' });

  await deleteResourceRecord(req.params.id);
  if (resource.storageProvider === 'cloudinary') {
    await deleteCloudinaryFile(resource.publicId);
  } else {
    try { await fs.unlink(path.join(uploadDir, resource.fileName)); } catch {}
  }
  res.json({ message: 'Resource deleted successfully.' });
}

export async function downloadResource(req, res) {
  const resource = await findResourceById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  await updateResourceRecord(req.params.id, { downloads: resource.downloads + 1 });
  if (resource.fileUrl) return res.redirect(resource.fileUrl);
  const filePath = path.resolve(uploadDir, resource.fileName);
  try {
    await fs.access(filePath);
  } catch {
    return res.status(410).json({
      message: 'This file is no longer available. Vercel local upload storage is temporary. Configure Cloudinary and upload the document again.'
    });
  }
  return res.download(filePath, resource.originalName);
}

export async function dashboard(req, res) {
  res.json(await getDashboardData(req.user.id));
}
