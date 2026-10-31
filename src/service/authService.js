import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomBytes, createHash } from 'node:crypto'
import { Op } from 'sequelize'
import RefreshToken from '../model/refreshToken.js'
import User from '../model/user.js'
import PasswordResetToken from '../model/passwordResetToken.js'
import StudentProfile from '../model/studentProfile.js'
import EmailVerificationToken from '../model/emailVerificationToken.js'
import sequelize from '../config/database.js'
import { sendVerificationEmail } from './emailService.js'

// Generate Access Token
export const createAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: '15m'
        }
    )
}

// Generate Refresh Token
const createRefreshToken = () => {
    return randomBytes(64).toString('hex')
}

// Hash Refresh Token
const hashRefreshToken = (token) => {
    return createHash('sha256').update(token).digest('hex')
}

// Hash Password Reset Token
const hashResetToken = (token) => {
    return createHash('sha256').update(token).digest('hex')
}

// Save refresh token to db
const saveRefreshToken = async (userId, refreshToken, transaction = null) => {
    const tokenHash = hashRefreshToken(refreshToken)

    await RefreshToken.create({
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }, transaction ? { transaction } : {})

    return refreshToken
}

// Register Service

export const registerUser = async (data) => {
    const { name, email, phone, password } = data

    if (!name || !email || !phone || !password) {
        const error = new Error('Name, email, phone, and password are required')
        error.statusCode = 400
        throw error
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({
        where: { email: normalizedEmail }
    })

    if (existingUser) {
        const error = new Error('Email already exists')
        error.statusCode = 409
        throw error
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const verificationToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(verificationToken).digest('hex')

    const transaction = await sequelize.transaction()

    let user

    try {
        user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            password_hash: hashedPassword,
            role: 'student'
        }, { transaction })

        await StudentProfile.create({
            user_id: user.id,
        }, { transaction })

        await EmailVerificationToken.create({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }, { transaction })

        await transaction.commit()

    } catch (error) {
        await transaction.rollback()
        throw error
    }

    await sendVerificationEmail(normalizedEmail, verificationToken)

    return {
        message: 'User registered successfully. Please check your email to verify your account.',
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image,
        created_at: user.created_at,
        updated_at: user.updated_at
    }
}


// Login Service
export const loginUser = async (email, password) => {
    if (!email || !password) {
        const error = new Error('Email and password are required')
        error.statusCode = 400
        throw error
    }

    const user = await User.findOne({
        where: {
            email: email.trim().toLowerCase()
        }
    })

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        const error = new Error('Email or password is invalid')
        error.statusCode = 401
        throw error
    }

    const accessToken = createAccessToken(user)
    const refreshToken = createRefreshToken()

    await saveRefreshToken(user.id, refreshToken)

    const sanitizedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image,
        created_at: user.created_at,
        updated_at: user.updated_at
    }

    return {
        user: sanitizedUser,
        accessToken,
        refreshToken
    }
}

// Get Profile
export const profileUser = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: {
            exclude: ['password_hash']
        }
    })

    if (!user) {
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
    }

    return user
}

// Update Profile
export const updateProfile = async (userId, data) => {
    const user = await User.findByPk(userId)
    if (!user) {
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
    }

    // Email update check
    if (data.email) {
        const normalizedEmail = data.email.trim().toLowerCase()
        if (normalizedEmail !== user.email) {
            const existingUser = await User.findOne({
                where: {
                    email: normalizedEmail,
                    id: { [Op.ne]: userId }
                }
            })
            if (existingUser) {
                const error = new Error('Email already exists')
                error.statusCode = 409
                throw error
            }
            user.email = normalizedEmail
        }
    }

    if (data.name !== undefined) {
        if (!data.name.trim()) {
            const error = new Error('Name cannot be empty')
            error.statusCode = 400
            throw error
        }
        user.name = data.name.trim()
    }

    if (data.phone !== undefined) {
        user.phone = data.phone ? data.phone.trim() : null
    }

    if (data.profile_image !== undefined) {
        user.profile_image = data.profile_image
    }

    // Note: Role and password_hash are never modified here
    await user.save()

    return await User.findByPk(userId, {
        attributes: {
            exclude: ['password_hash']
        }
    })
}

// Change Password
export const changePassword = async (userId, currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
        const error = new Error('Current password and new password are required')
        error.statusCode = 400
        throw error
    }

    if (newPassword.length < 8) {
        const error = new Error('New password must be at least 8 characters')
        error.statusCode = 400
        throw error
    }

    const user = await User.findByPk(userId)
    if (!user) {
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isMatch) {
        const error = new Error('Current password is incorrect')
        error.statusCode = 400
        throw error
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    return await sequelize.transaction(async (transaction) => {
        user.password_hash = hashedPassword
        await user.save({ transaction })

        // Revoke all refresh tokens for this user on password change
        await RefreshToken.destroy({
            where: { userId: user.id },
            transaction
        })

        return {
            message: 'Password changed successfully'
        }
    })
}

// Refresh Token Session
export const refreshSession = async (oldToken) => {
    if (!oldToken) {
        const error = new Error('Refresh token is required')
        error.statusCode = 401
        throw error
    }

    const oldHashToken = hashRefreshToken(oldToken)

    return await sequelize.transaction(async (transaction) => {
        const storeToken = await RefreshToken.findOne({
            where: {
                tokenHash: oldHashToken
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        })

        if (!storeToken) {
            const error = new Error('Invalid refresh token')
            error.statusCode = 401
            throw error
        }

        if (new Date(storeToken.expiresAt) <= new Date()) {
            await storeToken.destroy({ transaction })

            const error = new Error('Refresh token has expired')
            error.statusCode = 401
            throw error
        }

        const user = await User.findByPk(storeToken.userId, {
            transaction
        })

        if (!user) {
            const error = new Error('User not found')
            error.statusCode = 404
            throw error
        }

        await storeToken.destroy({ transaction })

        const accessToken = createAccessToken(user)
        const refreshToken = createRefreshToken()

        await saveRefreshToken(user.id, refreshToken, transaction)

        return {
            accessToken,
            refreshToken
        }
    })
}

// Logout Service
export const logoutUser = async (refreshToken) => {
    if (!refreshToken) {
        return
    }

    const tokenHash = hashRefreshToken(refreshToken)

    await RefreshToken.destroy({
        where: {
            tokenHash
        }
    })
}

// Forgot Password Service
export const forgotPassword = async (email) => {
    if (!email) {
        const error = new Error('Email is required')
        error.statusCode = 400
        throw error
    }

    const user = await User.findOne({
        where: {
            email: email.trim().toLowerCase()
        }
    })

    const message = 'If your email is registered, you will receive a password reset link.'

    if (!user) {
        return { message }
    }

    await PasswordResetToken.destroy({
        where: {
            userId: user.id
        }
    })

    const resetToken = randomBytes(32).toString('hex')
    const tokenHash = hashResetToken(resetToken)

    await PasswordResetToken.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    })

    if (process.env.NODE_ENV !== 'production') {
        console.log('Reset Token:', resetToken)
        console.log('Reset Token Hash:', tokenHash)
    }

    return { message }
}

// Reset Password Service
export const resetPassword = async (token, newPassword) => {
    const tokenHash = hashResetToken(token)

    return await sequelize.transaction(async (transaction) => {
        const resetRecord = await PasswordResetToken.findOne({
            where: { tokenHash },
            transaction,
            lock: transaction.LOCK.UPDATE
        })

        if (!resetRecord) {
            const error = new Error('Invalid or expired reset token')
            error.statusCode = 400
            throw error
        }

        if (resetRecord.expiresAt < new Date()) {
            const error = new Error('Reset token has expired')
            error.statusCode = 400
            throw error
        }

        const user = await User.findByPk(resetRecord.userId, {
            transaction
        })

        if (!user) {
            const error = new Error('User not found')
            error.statusCode = 404
            throw error
        }

        user.password_hash = await bcrypt.hash(newPassword, 12)
        await user.save({ transaction })

        await PasswordResetToken.destroy({
            where: { userId: user.id },
            transaction
        })

        await RefreshToken.destroy({
            where: { userId: user.id },
            transaction
        })

        return {
            message: 'Password reset successfully'
        }
    })
}
