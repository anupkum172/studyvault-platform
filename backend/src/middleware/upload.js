import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';
import { uploadDir } from '../utils/paths.js';
import { hasCloudinary } from '../utils/cloudinary.js';

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${nanoid(6)}-${safeName}`);
  }
});

const storage = hasCloudinary ? multer.memoryStorage() : diskStorage;

const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg'];

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(ext)) return cb(new Error('Only PDF, DOC, PPT, TXT and image files are allowed.'));
  cb(null, true);
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });
