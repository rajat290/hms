import rateLimit from 'express-rate-limit'

const createLimiter = ({ windowMs, limit, message, skip, ...options }) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        skip,
        message: { success: false, message },
        ...options,
    })

const apiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: 'Too many requests. Please try again later.',
    skip: (req) => req.path === '/health' || req.originalUrl === '/api/health',
})

const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: 'Too many login attempts. Please try again later.',
    skipSuccessfulRequests: true,
})

const forgotPasswordLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: 'Too many password reset requests. Please try again in an hour.',
})

const aiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 25,
    message: 'AI request limit reached. Please try again later.',
})

export { createLimiter, apiLimiter, authLimiter, forgotPasswordLimiter, aiLimiter }
