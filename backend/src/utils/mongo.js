import mongoose from 'mongoose';

let connectionPromise;

export const hasMongo = Boolean(process.env.MONGODB_URI);

export async function connectMongo() {
  if (!hasMongo) return null;
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  connectionPromise ||= mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || undefined
  });

  return connectionPromise;
}

export function toPlain(document) {
  if (!document) return null;
  const plain = typeof document.toObject === 'function' ? document.toObject() : document;
  const { _id, __v, ...rest } = plain;
  return rest;
}
