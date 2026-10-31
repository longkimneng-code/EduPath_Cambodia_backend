import sequelize from "../config/database.js";
import User from "../model/user.js";
import EmailVerificationToken from "../model/emailVerificationToken.js";
import { createHash } from "crypto";

import transporter from '../config/email.js';

// Send Verification Email
export const sendVerificationEmail = async (email, token) => {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your EduPath Cambodia Account',
        html: `
            <h2>Welcome to EduPath Cambodia!</h2>
            <p>Please click the link below to verify your email address.</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link expires in 24 hours.</p>
        `
    })
}

export const verifyEmail = async (token) => {
    if (!token) {
        const error = new Error('Token is required');
        error.statusCode = 400;
        throw error;
    }

    const tokenHash = createHash('sha256')
        .update(token)
        .digest('hex');

    const emailVerificationToken = await EmailVerificationToken.findOne({
        where: { tokenHash },
    });

    if (!emailVerificationToken) {
        const error = new Error('Invalid token');
        error.statusCode = 400;
        throw error;
    }

    if (emailVerificationToken.expiresAt < new Date()) {
        const error = new Error('Token has expired');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findByPk(emailVerificationToken.userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    await sequelize.transaction(async (transaction) => {
        await user.update({
            isEmailVerified: true
        }, { transaction });

        await emailVerificationToken.destroy({ transaction });
    });

    return {
        message: 'Email verified successfully'
    };
};
