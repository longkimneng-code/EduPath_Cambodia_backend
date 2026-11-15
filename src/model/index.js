import University from './university.js'
import Major from './major.js'
import UniversityMajor from './universityMajor.js'
import User from './user.js'
import RefreshToken from './refreshToken.js'
import PasswordResetToken from './passwordResetToken.js'
import StudentProfile from './studentProfile.js'
import EmailVerificationToken from './emailVerificationToken.js'
import Department from './department.js'
import Facility from './facility.js'
import Scholarship from './scholarship.js'
import Event from './event.js'
import EventRegistration from './eventRegistration.js'
import Favorite from './favorite.js'
import Review from './review.js'
import Notification from './notification.js'

// --- User Associations ---
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

User.hasMany(EmailVerificationToken, {
    foreignKey: 'userId',
    as: 'emailVerificationTokens',
    onDelete: 'CASCADE'
})

EmailVerificationToken.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
})

// --- Discovery University & Major Associations ---
University.belongsToMany(Major, {
    through: UniversityMajor,
    foreignKey: 'universityId',
    otherKey: 'majorId',
    as: 'majors'
})

Major.belongsToMany(University, {
    through: UniversityMajor,
    foreignKey: 'majorId',
    otherKey: 'universityId',
    as: 'universities'
})

University.hasMany(Department, {
    foreignKey: 'university_id',
    as: 'departmentRecords',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

Department.belongsTo(University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

University.hasMany(Facility, {
    foreignKey: 'university_id',
    as: 'facilityRecords',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

Facility.belongsTo(University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

University.hasMany(Scholarship, {
    foreignKey: 'university_id',
    as: 'scholarships',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
})

Scholarship.belongsTo(University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
})

University.hasMany(Event, {
    foreignKey: 'university_id',
    as: 'events',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

Event.belongsTo(University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

University.hasMany(Review, {
    foreignKey: 'university_id',
    as: 'reviews',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

Review.belongsTo(University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

University.hasMany(Favorite, {
    foreignKey: 'university_id',
    as: 'favorites',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

Favorite.belongsTo(University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

// --- Event & EventRegistration Associations ---
Event.hasMany(EventRegistration, {
    foreignKey: 'event_id',
    as: 'registrations',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

EventRegistration.belongsTo(Event, {
    foreignKey: 'event_id',
    as: 'event',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

// --- StudentProfile Associations ---
StudentProfile.hasMany(EventRegistration, {
    foreignKey: 'student_id',
    as: 'eventRegistrations',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

EventRegistration.belongsTo(StudentProfile, {
    foreignKey: 'student_id',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

StudentProfile.hasMany(Favorite, {
    foreignKey: 'student_id',
    as: 'favorites',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

Favorite.belongsTo(StudentProfile, {
    foreignKey: 'student_id',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

StudentProfile.hasMany(Review, {
    foreignKey: 'student_id',
    as: 'reviews',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

Review.belongsTo(StudentProfile, {
    foreignKey: 'student_id',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

StudentProfile.hasMany(Notification, {
    foreignKey: 'student_id',
    as: 'notifications',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

Notification.belongsTo(StudentProfile, {
    foreignKey: 'student_id',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

export {
    User,
    RefreshToken,
    PasswordResetToken,
    StudentProfile,
    EmailVerificationToken,
    University,
    Major,
    UniversityMajor,
    Department,
    Facility,
    Scholarship,
    Event,
    EventRegistration,
    Favorite,
    Review,
    Notification
}
