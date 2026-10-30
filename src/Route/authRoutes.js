
import express from 'express'
import { Login, Register, GetProfile, RefreshToken, Logout,ForgotPassword ,ResetPassword} from "../controller/authController.js"
import { verifyToken } from "../middleware/authMiddleware.js"

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: EduPath user authentication
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: daro123
 *               firstName:
 *                 type: string
 *                 example: Daro
 *               lastName:
 *                 type: string
 *                 example: Sok
 *               email:
 *                 type: string
 *                 example: daro@gmail.com
 *               phone:
 *                 type: string
 *                 example: "012345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already exists
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
 *                 example: daro@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', Login)

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Get the profile of the currently authenticated user.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/profile", verifyToken, GetProfile)

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token and refresh token using the refresh token stored in the HTTP-only cookie.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", RefreshToken)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Delete the refresh token from the database and clear the refresh token cookie.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successfully
 *       500:
 *         description: Logout failed
 */
router.post("/logout", Logout)

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     description: Sends a password reset link if the email is registered. The same response is returned whether the account exists or not.
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
router.post('/forgot-password', ForgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Resets the user's password using a valid, unexpired password reset token.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         description: Missing fields, passwords do not match, or invalid/expired reset token
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', ResetPassword);
export default router
