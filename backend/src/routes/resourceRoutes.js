import express from 'express';
import { createResource, dashboard, deleteResource, downloadResource, getResources, updateResource } from '../controllers/resourceController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.get('/', protect, getResources);
router.get('/meta/dashboard', protect, dashboard);
router.post('/', protect, upload.single('file'), createResource);
router.put('/:id', protect, updateResource);
router.delete('/:id', protect, deleteResource);
router.get('/:id/download', protect, downloadResource);
export default router;
