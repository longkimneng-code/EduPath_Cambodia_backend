import express from 'express'
import {
    CreateStudentProfile,
    GetStudentProfile,
    UpdateStudentProfile
} from '../controller/studentController.js'
import { verifyToken } from '../middleware/authMiddleware.js'
import roleMiddleware from '../middleware/roleMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student profile management (student role only)
 */

/**
 * @swagger
 * /api/students/profile:
 *   get:
 *     summary: Get current authenticated student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student profile retrieved successfully
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *                     province:
 *                       type: string
 *                       example: Phnom Penh
 *                     date_of_birth:
 *                       type: string
 *                       format: date
 *                       example: "2004-05-15"
 *                     interests:
 *                       type: string
 *                       example: Computer Science, AI, Web Development
 *                     strengths:
 *                       type: string
 *                       example: Problem solving, analytical thinking
 *                     career_goal:
 *                       type: string
 *                       example: Full Stack Software Engineer
 *                     created_at:
 *                       type: string
 *                       example: "2026-10-30T10:00:00.000Z"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: Sok Daro
 *                         email:
 *                           type: string
 *                           example: daro@gmail.com
 *                         role:
 *                           type: string
 *                           example: student
 *                         phone:
 *                           type: string
 *                           example: "012345678"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Access forbidden - only student accounts allowed
 *       404:
 *         description: Student profile not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile', verifyToken, roleMiddleware('student'), GetStudentProfile)

/**
 * @swagger
 * /api/students/profile:
 *   post:
 *     summary: Create student profile for authenticated student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               province:
 *                 type: string
 *                 example: Phnom Penh
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "2004-05-15"
 *               interests:
 *                 type: string
 *                 example: Computer Science, AI, Web Development
 *               strengths:
 *                 type: string
 *                 example: Problem solving, analytical thinking
 *               career_goal:
 *                 type: string
 *                 example: Full Stack Software Engineer
 *     responses:
 *       201:
 *         description: Student profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student profile created successfully
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *                     province:
 *                       type: string
 *                       example: Phnom Penh
 *                     date_of_birth:
 *                       type: string
 *                       format: date
 *                       example: "2004-05-15"
 *                     interests:
 *                       type: string
 *                       example: Computer Science, AI, Web Development
 *                     strengths:
 *                       type: string
 *                       example: Problem solving, analytical thinking
 *                     career_goal:
 *                       type: string
 *                       example: Full Stack Software Engineer
 *                     created_at:
 *                       type: string
 *                       example: "2026-10-30T10:00:00.000Z"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Access forbidden - only student accounts allowed
 *       404:
 *         description: User not found
 *       409:
 *         description: Student profile already exists for this user
 *       500:
 *         description: Internal server error
 */
router.post('/profile', verifyToken, roleMiddleware('student'), CreateStudentProfile)

/**
 * @swagger
 * /api/students/profile:
 *   put:
 *     summary: Update student profile for authenticated student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               province:
 *                 type: string
 *                 example: Siem Reap
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "2004-05-15"
 *               interests:
 *                 type: string
 *                 example: Cloud Computing, DevOps
 *               strengths:
 *                 type: string
 *                 example: System design, critical thinking
 *               career_goal:
 *                 type: string
 *                 example: Cloud Solutions Architect
 *     responses:
 *       200:
 *         description: Student profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student profile updated successfully
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *                     province:
 *                       type: string
 *                       example: Siem Reap
 *                     date_of_birth:
 *                       type: string
 *                       format: date
 *                       example: "2004-05-15"
 *                     interests:
 *                       type: string
 *                       example: Cloud Computing, DevOps
 *                     strengths:
 *                       type: string
 *                       example: System design, critical thinking
 *                     career_goal:
 *                       type: string
 *                       example: Cloud Solutions Architect
 *                     created_at:
 *                       type: string
 *                       example: "2026-10-30T10:00:00.000Z"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Access forbidden - only student accounts allowed
 *       404:
 *         description: Student profile not found
 *       500:
 *         description: Internal server error
 */
router.put('/profile', verifyToken, roleMiddleware('student'), UpdateStudentProfile)

export default router

