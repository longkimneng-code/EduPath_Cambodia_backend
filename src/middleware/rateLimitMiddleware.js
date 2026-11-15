import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isTest ? 1000 : 30, // Limit each IP to 30 requests per windowMs
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: true, // Skip counting successful requests (status < 400) toward the rate limit
})

export const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: isTest ? 1000 : 30, // Limit each IP to 30 requests per windowMs
    message: {
        message: 'Too many email verification requests from this IP, please try again after 1 hour'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

export const passwordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isTest ? 1000 : 30, // Limit each IP to 30 requests per windowMs
    message: {
        message: 'Too many password reset requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

