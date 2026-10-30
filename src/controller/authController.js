
import { registerUser,loginUser,profileUser,logoutUser,refreshSession } from '../service/authService.js'

// Register Controller
export const Register = async (req, res) => {
    try {
        const user = await registerUser(req.body)

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

        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}


// get profile 
export const GetProfile = async (req,res)=>{
    try{
        const user = await profileUser(req.user.id)
        return res.status(200).json({
            message: "Profile is retrive succes fully",
            user
        })

    }catch(error){
        return res.status(500).json({
            message: "intenal server errro"
        })
        console.log(error)
    }
}
// refreh token 
export const RefreshToken = async(req,res)=>{
    try {
        const oldRefreshToken = req.cookies.refreshToken
        const token = await refreshSession(oldRefreshToken)

        res.cookie("refreshToken", token.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/api/auth",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json({
            message: "TOken refresh successfully",
            accessToken: token.accessToken
        })
        
    } catch (error) {
        res.status(500).json({
            message: "Internal server Error"
        })
        console.log(error)
    }
}


// logout 
export const Logout = async(req,res)=>{
    try{
        const refreshToken = req.cookies.refreshToken 
        await logoutUser(refreshToken)

        // clear cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/api/auth"
        })

        return res.status(200).json({
            message: "logout successs><"
        })
    } catch (error){
        return res.status(500).json({
            message: "Internal server Error"
        })
        console.log(error)
    }
}