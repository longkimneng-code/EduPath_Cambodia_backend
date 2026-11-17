import express from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/generate', asyncHandler(aiController.generate));
router.post('/chat', asyncHandler(aiController.chat));

export default router;
