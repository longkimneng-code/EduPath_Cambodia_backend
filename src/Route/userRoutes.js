import express from 'express'
import { GetUserProfile, UpdateUserProfile } from '../controller/userController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User account profile management
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User profile retrieved successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Sok Daro
 *                     email:
 *                       type: string
 *                       example: daro@gmail.com
 *                     role:
 *                       type: string
 *                       example: student
 *                     profile_image:
 *                       type: string
 *                       nullable: true
 *                       example: "https://example.com/avatar.jpg"
 *                     phone:
 *                       type: string
 *                       example: "012345678"
 *                     created_at:
 *                       type: string
 *                       example: "2026-10-30T10:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       example: "2026-10-30T10:00:00.000Z"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile', verifyToken, GetUserProfile)

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current authenticated user profile
 *     description: Update user details. Roles cannot be updated through this endpoint.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sok Daro
 *               email:
 *                 type: string
 *                 format: email
 *                 example: daro.updated@gmail.com
 *               phone:
 *                 type: string
 *                 example: "098765432"
 *               profile_image:
 *                 type: string
 *                 example: "https://example.com/avatar-new.jpg"
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User profile updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Sok Daro
 *                     email:
 *                       type: string
 *                       example: daro.updated@gmail.com
 *                     role:
 *                       type: string
 *                       example: student
 *                     profile_image:
 *                       type: string
 *                       example: "https://example.com/avatar-new.jpg"
 *                     phone:
 *                       type: string
 *                       example: "098765432"
 *                     created_at:
 *                       type: string
 *                       example: "2026-10-30T10:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       example: "2026-10-30T10:15:00.000Z"
 *       400:
 *         description: Validation error or invalid data
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Internal server error
 */
router.put('/profile', verifyToken, UpdateUserProfile)

export default router

