import { getAppConfig } from './appConfig.js'

const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)

const getAllowedOrigins = () => {
    const { security } = getAppConfig()
    const singleOrigins = [
        security.frontendUrl,
        security.adminUrl,
        security.clientUrl,
        security.appUrl,
    ].filter(Boolean)

    return new Set([...security.corsOrigins, ...singleOrigins])
}

const corsOptions = {
    origin(origin, callback) {
        const allowedOrigins = getAllowedOrigins()

        if (!origin || allowedOrigins.has(origin) || isLocalOrigin(origin)) {
            return callback(null, true)
        }

        return callback(new Error('Origin not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'atoken', 'dtoken', 'stoken'],
    credentials: true,
    optionsSuccessStatus: 200,
}

const helmetOptions = {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}

export { corsOptions, helmetOptions }
