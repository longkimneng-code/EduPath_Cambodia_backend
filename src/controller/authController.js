import { registerUser, loginUser, profileUser, logoutUser, refreshSession, forgotPassword, resetPassword, changePassword } from '../service/authService.js'
import {verifyEmail} from '../service/emailService.js'

// Register Controller
export const Register = async (req, res) => {
    try {
        const user = await registerUser(req.body)

        return res.status(201).json({
            message: 'User registered successfully',
            user
        })
    } catch (error) {
        console.error('Register error:', error.message)

        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

// Login Controller
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body

        const { user, accessToken, refreshToken } = await loginUser(email, password)

        // Set Refresh Token Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json({
            message: 'Login successful',
            accessToken,
            user
        })
    } catch (error) {
        console.error('Login error:', error.message)

        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

// Get Profile
export const GetProfile = async (req, res) => {
    try {
        const user = await profileUser(req.user.id)
        return res.status(200).json({
            message: 'Profile retrieved successfully',
            user
        })
    } catch (error) {
        console.error('Get Profile error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

// Refresh Token
export const RefreshToken = async (req, res) => {
    try {
        const oldRefreshToken = req.cookies.refreshToken
        const token = await refreshSession(oldRefreshToken)

        res.cookie('refreshToken', token.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json({
            message: 'Token refreshed successfully',
            accessToken: token.accessToken
        })
    } catch (error) {
        console.error('Refresh Token error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

// Logout
export const Logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken
        await logoutUser(refreshToken)

        // Clear cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth'
        })

        return res.status(200).json({
            message: 'Logout successfully'
        })
    } catch (error) {
        console.error('Logout error:', error.message)
        return res.status(500).json({
            message: 'Internal server error'
        })
    }
}

// Forgot Password
export const ForgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        const result = await forgotPassword(email)

        return res.status(200).json({
            message: result.message
        })
    } catch (error) {
        console.error('Forgot Password error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

// Reset Password
export const ResetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body

        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: 'All fields are required'
            })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: 'Passwords do not match'
            })
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters'
            })
        }

        const result = await resetPassword(token, newPassword)

        return res.status(200).json({
            message: result.message
        })
    } catch (error) {
        console.error('Reset Password error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

// Change Password
export const ChangePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required'
            })
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            return res.status(400).json({
                message: 'Passwords do not match'
            })
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: 'New password must be at least 8 characters'
            })
        }

        const result = await changePassword(req.user.id, currentPassword, newPassword)

        // Clear refresh token cookie since tokens are revoked
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth'
        })

        return res.status(200).json({
            message: result.message
        })
    } catch (error) {
        console.error('Change Password error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}


// Verify Email
export const VerifyEmail = async (req, res) => {
    try {
        const { token } = req.body

        if (!token) {
            return res.status(400).json({
                message: 'Token is required'
            })
        }
        await verifyEmail(token)

        return res.status(200).json({
            message: 'Email verified successfully'
        })
    } catch (error) {
        console.error('Verify Email error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}