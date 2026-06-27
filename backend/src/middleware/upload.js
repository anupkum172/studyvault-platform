import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${nanoid(6)}-${safeName}`);
  }
});

const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg'];

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(ext)) return cb(new Error('Only PDF, DOC, PPT, TXT and image files are allowed.'));
  cb(null, true);
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });
