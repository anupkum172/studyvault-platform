import mongoose from 'mongoose';

let connectionPromise;

export const hasMongo = Boolean(process.env.MONGODB_URI);
export class DatabaseConnectionError extends Error {
  constructor(message = 'Database connection failed. Check MONGODB_URI and MongoDB Atlas Network Access.') {
    super(message);
    this.name = 'DatabaseConnectionError';
    this.statusCode = 503;
  }
}

export async function connectMongo() {
  if (!hasMongo) return null;
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  connectionPromise ||= mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || undefined,
    serverSelectionTimeoutMS: 7000,
    connectTimeoutMS: 7000,
    socketTimeoutMS: 12000,
    maxPoolSize: 5
  }).catch((error) => {
    connectionPromise = undefined;
    throw new DatabaseConnectionError(error.message);
  });

  return connectionPromise;
}

export function toPlain(document) {
  if (!document) return null;
  const plain = typeof document.toObject === 'function' ? document.toObject() : document;
  const { _id, __v, ...rest } = plain;
  return rest;
}
