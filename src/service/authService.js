
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomBytes, createHash } from 'node:crypto'
import RefreshToken from '../model/refreshToken.js'
import User from '../model/user.js'
import PasswordResetToken from '../model/passwordResetToken.js'
import sequelize from '../config/database.js'

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
    return createHash('sha256').update(token).digest('hex');
};

// save refresh token to db
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
    const { username, firstName, lastName, email, phone, password } = data

    if (!username || !firstName || !lastName || !email || !phone || !password) {
        const error = new Error('Username, first name, last name, email, phone, and password are required')
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

    const user = await User.create({
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone,
        password: hashedPassword,
        role: 'student'
    })

    return user
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

    if (!user || !(await bcrypt.compare(password, user.password))) {
        const error = new Error('Email or password is invalid')
        error.statusCode = 401
        throw error
    }

    const accessToken = createAccessToken(user)

    // Generate random Refresh Token
    const refreshToken = createRefreshToken()

    // Save refresh token to db
    await saveRefreshToken(user.id, refreshToken)

    return {
        user,
        accessToken,
        refreshToken
    }
}

// get profile
export const profileUser = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: {
            exclude: ["password"]
        }
    })

    if (!user) {
        const error = new Error("User not found")
        error.statusCode = 404
        throw error
    }

    return user
}

// refresh token
export const refreshSession = async (oldToken) => {
    if (!oldToken) {
        const error = new Error("Refresh token is required")
        error.statusCode = 401
        throw error
    }

    // hash old token
    const oldHashToken = hashRefreshToken(oldToken)

    // find old token in db
    return await sequelize.transaction(async (transaction) => {

        const storeToken = await RefreshToken.findOne({
            where: {
                tokenHash: oldHashToken
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        })

        if (!storeToken) {
            const error = new Error("Invalid refresh token")
            error.statusCode = 401
            throw error
        }

        // check expired
        if (new Date(storeToken.expiresAt) <= new Date()) {
            await storeToken.destroy({ transaction })

            const error = new Error("Refresh token has expired")
            error.statusCode = 401
            throw error
        }

        // find user
        const user = await User.findByPk(storeToken.userId, {
            transaction
        })

        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404
            throw error
        }

        // delete old token
        await storeToken.destroy({ transaction })

        // generate new tokens
        const accessToken = createAccessToken(user)
        const refreshToken = createRefreshToken()

        // save new refresh token to db
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

    // hash refresh token
    const tokenHash = hashRefreshToken(refreshToken)

    // delete refresh token from db
    await RefreshToken.destroy({
        where: {
            tokenHash
        }
    })
}

// forgot password 

export const forgotPassword = async (email) => {
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

    // Generate original reset token
    const resetToken = randomBytes(32).toString('hex')

    // Store only hashed token
    const tokenHash = hashResetToken(resetToken)

    await PasswordResetToken.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    })

    // Development only
    if (process.env.NODE_ENV !== 'production') {
        console.log('Reset Token:', resetToken)
        console.log('Reset Token Hash:', tokenHash)
    }

    return { message }
}


// reset password
export const resetPassword = async (token, newPassword) => {
  const tokenHash = hashResetToken(token);
  console.log('Submitted Token Hash:', tokenHash);

  return await sequelize.transaction(async (transaction) => {
    // Find reset token
    const resetRecord = await PasswordResetToken.findOne({
      where: { tokenHash },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!resetRecord) {
      throw new Error('Invalid or expired reset token');
    }

    // Check expiration
    if (resetRecord.expiresAt < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Find user
    const user = await User.findByPk(resetRecord.userId, {
      transaction,
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save({ transaction });

    // Delete all reset tokens belonging to this user
    await PasswordResetToken.destroy({
      where: { userId: user.id },
      transaction,
    });

    // Revoke all refresh tokens
    await RefreshToken.destroy({
      where: { userId: user.id },
      transaction,
    });

    return {
      message: 'Password reset successfully',
    };
  });
};