const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

const singleOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    process.env.CLIENT_URL,
    process.env.APP_URL,
].filter(Boolean)

const allowedOrigins = new Set([...configuredOrigins, ...singleOrigins])

const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin) || isLocalOrigin(origin)) {
            return callback(null, true)
        }

        return callback(new Error('Origin not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'atoken', 'dtoken', 'stoken'],
    optionsSuccessStatus: 200,
}

const helmetOptions = {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}

export { corsOptions, helmetOptions }
