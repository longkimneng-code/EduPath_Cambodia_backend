import { profileUser, updateProfile } from '../service/authService.js'

// Get User Profile
export const GetUserProfile = async (req, res) => {
    try {
        const user = await profileUser(req.user.id)

        return res.status(200).json({
            message: 'User profile retrieved successfully',
            user
        })
    } catch (error) {
        console.error('Get User Profile error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

// Update User Profile
export const UpdateUserProfile = async (req, res) => {
    try {
        const { name, email, phone, profile_image } = req.body

        const updatedUser = await updateProfile(req.user.id, {
            name,
            email,
            phone,
            profile_image
        })

        return res.status(200).json({
            message: 'User profile updated successfully',
            user: updatedUser
        })
    } catch (error) {
        console.error('Update User Profile error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

