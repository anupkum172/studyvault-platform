import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { readDB, writeDB } from '../utils/db.js';

export async function getResources(req, res) {
  const { q = '', semester = '', subject = '', type = '', branch = '' } = req.query;
  const db = await readDB();
  const keyword = q.toLowerCase();
  let resources = db.resources.map((r) => ({ ...r, isOwner: r.ownerId === req.user?.id }));

  if (keyword) {
    resources = resources.filter((r) => [r.title, r.subject, r.description, r.tags, r.branch].join(' ').toLowerCase().includes(keyword));
  }
  if (semester) resources = resources.filter((r) => r.semester === semester);
  if (subject) resources = resources.filter((r) => r.subject.toLowerCase().includes(subject.toLowerCase()));
  if (type) resources = resources.filter((r) => r.type === type);
  if (branch) resources = resources.filter((r) => r.branch.toLowerCase().includes(branch.toLowerCase()));

  resources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ resources });
}

export async function createResource(req, res) {
  const { title, subject, semester, branch, type, description = '', tags = '' } = req.body;
  if (!title || !subject || !semester || !branch || !type) {
    return res.status(400).json({ message: 'Title, subject, semester, branch and type are required.' });
  }
  if (!req.file) return res.status(400).json({ message: 'File is required.' });

  const db = await readDB();
  const resource = {
    id: nanoid(),
    title,
    subject,
    semester,
    branch,
    type,
    description,
    tags,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    fileSize: req.file.size,
    ownerId: req.user.id,
    ownerName: req.user.name,
    downloads: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.resources.push(resource);
  await writeDB(db);
  res.status(201).json({ resource });
}

export async function updateResource(req, res) {
  const db = await readDB();
  const resource = db.resources.find((r) => r.id === req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  if (resource.ownerId !== req.user.id) return res.status(403).json({ message: 'You can edit only your own resource.' });

  const allowed = ['title', 'subject', 'semester', 'branch', 'type', 'description', 'tags'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) resource[key] = req.body[key];
  });
  resource.updatedAt = new Date().toISOString();
  await writeDB(db);
  res.json({ resource });
}

export async function deleteResource(req, res) {
  const db = await readDB();
  const index = db.resources.findIndex((r) => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Resource not found.' });
  const resource = db.resources[index];
  if (resource.ownerId !== req.user.id) return res.status(403).json({ message: 'You can delete only your own resource.' });

  db.resources.splice(index, 1);
  await writeDB(db);
  try { await fs.unlink(path.join('uploads', resource.fileName)); } catch {}
  res.json({ message: 'Resource deleted successfully.' });
}

export async function downloadResource(req, res) {
  const db = await readDB();
  const resource = db.resources.find((r) => r.id === req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  resource.downloads += 1;
  await writeDB(db);
  res.download(path.resolve('uploads', resource.fileName), resource.originalName);
}

export async function dashboard(req, res) {
  const db = await readDB();
  const myResources = db.resources.filter((r) => r.ownerId === req.user.id);
  const totalDownloads = myResources.reduce((sum, r) => sum + r.downloads, 0);
  res.json({
    stats: {
      totalResources: db.resources.length,
      myUploads: myResources.length,
      myDownloads: totalDownloads,
      subjects: new Set(db.resources.map((r) => r.subject)).size
    },
    recent: db.resources.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  });
}
