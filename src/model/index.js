import User from './user.js'
import RefreshToken from './refreshToken.js'
User.hasMany(RefreshToken, {
    foreignKey: 'userId',
    as: 'refreshTokens',
    onDelete: 'CASCADE'
})

RefreshToken.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
})

export { User, RefreshToken }