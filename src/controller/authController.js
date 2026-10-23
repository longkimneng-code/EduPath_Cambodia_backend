
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import RefreshToken from '../model/refreshToken.js';
import User from '../model/user.js';

const createAccessToken = (user) => {
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

const setRefreshCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
}

// Login
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required' 
            })
        }

        const user = await User.findOne({
            where: { 
                email: email.trim().toLowerCase() 
            }
        })

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ 
                message: 'Email or password is invalid' 
            })
        }

        const accessToken = createAccessToken(user)
        const refreshToken = randomBytes(64).toString('hex')
        const tokenHash = createHash('sha256').update(refreshToken).digest('hex')

        await RefreshToken.create({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })

        setRefreshCookie(res, refreshToken)

        return res.status(200).json({
            message: 'Login successful',
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        })
    } catch (error) {
        console.error('Login error:', error.message)
        return res.status(500).json({ 
            message: 'Internal server error' 
        })
    }
}
export const Register = async (req, res) => {
    try {
        const { username, firstName, lastName, email, phone, password } = req.body

        if (!username || !firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({
                message: 'Username, first name, last name, email, phone, and password are required'
            })
        }
        const existingUser = await User.findOne({ where: { email } })
        if (existingUser) {
            return res.status(409).json({ 
                message: 'Email already exists' 
            })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await User.create({
            username,
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: 'student'
        })

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        })
    } catch (error) {
        console.error('Register error:', error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}