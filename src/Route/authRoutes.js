import express from 'express'
import {
    Login,
    Register,
    GetProfile,
    RefreshToken,
    Logout,
    ForgotPassword,
    ResetPassword,
    ChangePassword,
    VerifyEmail
} from '../controller/authController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: EduPath user authentication and credential management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new student account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sok Daro
 *               email:
 *                 type: string
 *                 format: email
 *                 example: daro@gmail.com
 *               phone:
 *                 type: string
 *                 example: "012345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: Password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
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
 *                     phone:
 *                       type: string
 *                       example: "012345678"
 *                     role:
 *                       type: string
 *                       example: student
 *                     profile_image:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register', Register)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to an existing account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: daro@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
 *                     phone:
 *                       type: string
 *                       example: "012345678"
 *                     role:
 *                       type: string
 *                       example: student
 *                     profile_image:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */
router.post('/login', Login)

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile', verifyToken, GetProfile)

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token and rotate refresh token using cookie.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Internal server error
 */
router.post('/refresh', RefreshToken)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Revoke the refresh token from database and clear the cookie.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successfully
 *       500:
 *         description: Logout failed
 */
router.post('/logout', Logout)

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@gmail.com
 *     responses:
 *       200:
 *         description: Password reset request processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If your email is registered, you will receive a password reset link.
 *       400:
 *         description: Email is required
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', ForgotPassword)

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: 64-character-reset-token
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewPassword123
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Missing fields, passwords do not match, or invalid/expired reset token
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', ResetPassword)

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change password for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: Password123
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewPassword456
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewPassword456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Current password incorrect, validation error, or passwords do not match
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.put('/change-password', verifyToken, ChangePassword)

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email with verification token
 *     tags: [Authentication]
 *     parameters:
 *       - name: token
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Token is required
 *       500:
 *         description: Internal server error
 */
router.get('/verify-email', VerifyEmail)

export default router
