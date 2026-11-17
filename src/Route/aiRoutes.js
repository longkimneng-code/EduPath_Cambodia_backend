import express from 'express';
import { chat, generate, health, recommendMajor } from '../controller/aiController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI Guidance
 *   description: Gemini-powered educational counselor & guidance APIs
 */

/**
 * @swagger
 * /api/ai/health:
 *   get:
 *     summary: Check Gemini AI service health & configured model
 *     tags: [AI Guidance]
 *     responses:
 *       200:
 *         description: AI service is healthy
 */
router.get('/health', health);

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Educational guidance chat with bilingual Khmer/English support
 *     tags: [AI Guidance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: What are the best universities for Computer Science in Cambodia?
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, model]
 *                     text:
 *                       type: string
 *               studentProfile:
 *                 type: object
 *                 properties:
 *                   province:
 *                     type: string
 *                   bacIIGrade:
 *                     type: string
 *                   interests:
 *                     type: string
 *                   strengths:
 *                     type: string
 *                   career_goal:
 *                     type: string
 *     responses:
 *       200:
 *         description: Successful AI response
 *       400:
 *         description: Validation error
 */
router.post('/chat', chat);

/**
 * @swagger
 * /api/ai/recommend-major:
 *   post:
 *     summary: Generate structured university major recommendations for Cambodia
 *     tags: [AI Guidance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interests:
 *                 type: string
 *                 example: coding, artificial intelligence, robotics
 *               strengths:
 *                 type: string
 *                 example: mathematics, logical reasoning, problem solving
 *               favoriteSubjects:
 *                 type: string
 *                 example: Math, Physics, English
 *               careerGoals:
 *                 type: string
 *                 example: Become a Senior Software Architect in Phnom Penh
 *     responses:
 *       200:
 *         description: Structured recommendation data
 *       400:
 *         description: Validation error
 */
router.post('/recommend-major', recommendMajor);

/**
 * @swagger
 * /api/ai/generate:
 *   post:
 *     summary: Execute custom prompt generation with Gemini
 *     tags: [AI Guidance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: Explain the difference between Software Engineering and Computer Science for a high school graduate.
 *               systemInstruction:
 *                 type: string
 *               temperature:
 *                 type: number
 *                 example: 0.7
 *     responses:
 *       200:
 *         description: Generated response
 *       400:
 *         description: Validation error
 */
router.post('/generate', generate);

export default router;
