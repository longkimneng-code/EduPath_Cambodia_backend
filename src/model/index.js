import User from './user.js'
import RefreshToken from './refreshToken.js'
import PasswordResetToken from './passwordResetToken.js'
import StudentProfile from './studentProfile.js'

User.hasMany(RefreshToken, {
    foreignKey: 'userId',
    as: 'refreshTokens',
    onDelete: 'CASCADE'
})

RefreshToken.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
})

User.hasMany(PasswordResetToken, {
    foreignKey: 'userId',
    as: 'passwordResetTokens',
    onDelete: 'CASCADE'
})

PasswordResetToken.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
})

User.hasOne(StudentProfile, {
    foreignKey: 'user_id',
    as: 'studentProfile',
    onDelete: 'CASCADE'
})

StudentProfile.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
})

export { User, RefreshToken, PasswordResetToken, StudentProfile }
