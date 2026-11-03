import User from '../model/user.js'
import StudentProfile from '../model/studentProfile.js'


// Get Student Profile
export const getStudentProfile = async (userId) => {
    const user = await User.findByPk(userId)
    if (!user) {
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
    }

    if (user.role !== 'student') {
        const error = new Error('Only student accounts can access student profiles')
        error.statusCode = 403
        throw error
    }

    const profile = await StudentProfile.findOne({
        where: { user_id: userId },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'role', 'profile_image', 'phone']
            }
        ]
    })

    if (!profile) {
        const error = new Error('Student profile not found')
        error.statusCode = 404
        throw error
    }

    return profile
}

// Update Student Profile
export const updateStudentProfile = async (userId, data) => {
    if (Object.keys(data).length === 0) {
        const error = new Error('At least one field is required')
        error.statusCode = 400
        throw error
    }
    const user = await User.findByPk(userId)
    if (!user) {
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
    }

    if (user.role !== 'student') {
        const error = new Error('Only student accounts can manage student profiles')
        error.statusCode = 403
        throw error
    }

    const profile = await StudentProfile.findOne({
        where: { user_id: userId }
    })

    if (!profile) {
        const error = new Error('Student profile not found')
        error.statusCode = 404
        throw error
    }

    const { province, date_of_birth, interests, strengths, career_goal } = data

    if (province !== undefined) profile.province = province
    if (date_of_birth !== undefined) profile.date_of_birth = date_of_birth
    if (interests !== undefined) profile.interests = interests
    if (strengths !== undefined) profile.strengths = strengths
    if (career_goal !== undefined) profile.career_goal = career_goal

    await profile.save()

    return profile
}

