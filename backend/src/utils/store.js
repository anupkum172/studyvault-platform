import { readDB, writeDB } from './db.js';
import { connectMongo, hasMongo, toPlain } from './mongo.js';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';

function matchesResource(resource, filters) {
  const { q = '', semester = '', subject = '', type = '', branch = '' } = filters;
  const keyword = q.toLowerCase();

  if (keyword && ![resource.title, resource.subject, resource.description, resource.tags, resource.branch].join(' ').toLowerCase().includes(keyword)) return false;
  if (semester && resource.semester !== semester) return false;
  if (subject && !resource.subject.toLowerCase().includes(subject.toLowerCase())) return false;
  if (type && resource.type !== type) return false;
  if (branch && !resource.branch.toLowerCase().includes(branch.toLowerCase())) return false;

  return true;
}

export async function findUserByEmail(email) {
  if (hasMongo) {
    await connectMongo();
    return toPlain(await User.findOne({ email: String(email).toLowerCase() }));
  }

  const db = await readDB();
  return db.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

export async function findUserById(id) {
  if (hasMongo) {
    await connectMongo();
    return toPlain(await User.findOne({ id }));
  }

  const db = await readDB();
  return db.users.find((user) => user.id === id) || null;
}

export async function createUser(user) {
  if (hasMongo) {
    await connectMongo();
    return toPlain(await User.create(user));
  }

  const db = await readDB();
  db.users.push(user);
  await writeDB(db);
  return user;
}

export async function updateUser(id, updates) {
  if (hasMongo) {
    await connectMongo();
    return toPlain(await User.findOneAndUpdate({ id }, updates, { new: true }));
  }

  const db = await readDB();
  const user = db.users.find((item) => item.id === id);
  if (!user) return null;
  Object.assign(user, updates);
  await writeDB(db);
  return user;
}

export async function listResources(filters, currentUserId) {
  if (hasMongo) {
    await connectMongo();
    const resources = (await Resource.find({}).sort({ createdAt: -1 })).map(toPlain);
    return resources
      .filter((resource) => matchesResource(resource, filters))
      .map((resource) => ({ ...resource, isOwner: resource.ownerId === currentUserId }));
  }

  const db = await readDB();
  return db.resources
    .filter((resource) => matchesResource(resource, filters))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((resource) => ({ ...resource, isOwner: resource.ownerId === currentUserId }));
}

export async function createResourceRecord(resource) {
  if (hasMongo) {
    await connectMongo();
    return toPlain(await Resource.create(resource));
  }

  const db = await readDB();
  db.resources.push(resource);
  await writeDB(db);
  return resource;
}

export async function findResourceById(id) {
  if (hasMongo) {
    await connectMongo();
    return toPlain(await Resource.findOne({ id }));
  }

  const db = await readDB();
  return db.resources.find((resource) => resource.id === id) || null;
}

export async function updateResourceRecord(id, updates) {
  if (hasMongo) {
    await connectMongo();
    return toPlain(await Resource.findOneAndUpdate({ id }, updates, { new: true }));
  }

  const db = await readDB();
  const resource = db.resources.find((item) => item.id === id);
  if (!resource) return null;
  Object.assign(resource, updates);
  await writeDB(db);
  return resource;
}

export async function deleteResourceRecord(id) {
  if (hasMongo) {
    await connectMongo();
    return toPlain(await Resource.findOneAndDelete({ id }));
  }

  const db = await readDB();
  const index = db.resources.findIndex((resource) => resource.id === id);
  if (index === -1) return null;
  const [resource] = db.resources.splice(index, 1);
  await writeDB(db);
  return resource;
}

export async function getDashboardData(userId) {
  const resources = await listResources({}, userId);
  const myResources = resources.filter((resource) => resource.ownerId === userId);

  return {
    stats: {
      totalResources: resources.length,
      myUploads: myResources.length,
      myDownloads: myResources.reduce((sum, resource) => sum + resource.downloads, 0),
      subjects: new Set(resources.map((resource) => resource.subject)).size
    },
    recent: resources.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  };
}
