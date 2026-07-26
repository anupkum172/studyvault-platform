import express from 'express';
import { adminDeleteResource, adminOverview, adminReviewResource, adminUpdateResource } from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, requireAdmin);
router.get('/overview', adminOverview);
router.put('/resources/:id', adminUpdateResource);
router.patch('/resources/:id/review', adminReviewResource);
router.delete('/resources/:id', adminDeleteResource);

export default router;
