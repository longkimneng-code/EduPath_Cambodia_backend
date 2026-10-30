import { createStudentProfile, getStudentProfile, updateStudentProfile } from '../service/studentService.js'

// Create Student Profile
export const CreateStudentProfile = async (req, res) => {
    try {
        const profile = await createStudentProfile(req.user.id, req.body)

        return res.status(201).json({
            message: 'Student profile created successfully',
            profile
        })
    } catch (error) {
        console.error('Create Student Profile error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

// Get Student Profile
export const GetStudentProfile = async (req, res) => {
    try {
        const profile = await getStudentProfile(req.user.id)

        return res.status(200).json({
            message: 'Student profile retrieved successfully',
            profile
        })
    } catch (error) {
        console.error('Get Student Profile error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

// Update Student Profile
export const UpdateStudentProfile = async (req, res) => {
    try {
        const profile = await updateStudentProfile(req.user.id, req.body)

        return res.status(200).json({
            message: 'Student profile updated successfully',
            profile
        })
    } catch (error) {
        console.error('Update Student Profile error:', error.message)
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : 'Internal server error'
        })
    }
}

