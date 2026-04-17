import 'dotenv/config';
import { z } from 'zod';

const parseList = (value) => (
    String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
);

const optionalTrimmedString = z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.string().optional().default(''),
);

const normalizedEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
    PORT: z.coerce.number().int().positive().optional().default(4000),
    LOG_LEVEL: optionalTrimmedString,
    MONGODB_URI: optionalTrimmedString,
    JWT_SECRET: optionalTrimmedString,
    JWT_REFRESH_SECRET: optionalTrimmedString,
    ACCESS_TOKEN_TTL: optionalTrimmedString,
    REFRESH_TOKEN_TTL: optionalTrimmedString,
    ADMIN_EMAIL: optionalTrimmedString,
    ADMIN_PASSWORD: optionalTrimmedString,
    EMAIL_USER: optionalTrimmedString,
    EMAIL_PASS: optionalTrimmedString,
    CLOUDINARY_NAME: optionalTrimmedString,
    CLOUDINARY_API_KEY: optionalTrimmedString,
    CLOUDINARY_SECRET_KEY: optionalTrimmedString,
    CORS_ORIGINS: optionalTrimmedString,
    FRONTEND_URL: optionalTrimmedString,
    ADMIN_URL: optionalTrimmedString,
    CLIENT_URL: optionalTrimmedString,
    APP_URL: optionalTrimmedString,
    COOKIE_DOMAIN: optionalTrimmedString,
    COOKIE_SAME_SITE: optionalTrimmedString,
    COOKIE_SECURE: z.preprocess(
        (value) => {
            if (typeof value === 'string') {
                const normalizedValue = value.trim().toLowerCase();
                if (normalizedValue === 'true') return true;
                if (normalizedValue === 'false') return false;
            }

            return value;
        },
        z.boolean().optional().default(false),
    ),
}).passthrough();

const requiredRuntimeSchema = z.object({
    MONGODB_URI: z.string().trim().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: z.string().trim().min(1, 'JWT_SECRET is required'),
    ADMIN_EMAIL: z.string().trim().min(1, 'ADMIN_EMAIL is required'),
    ADMIN_PASSWORD: z.string().trim().min(1, 'ADMIN_PASSWORD is required'),
});

const normalizeEnv = (env = process.env) => normalizedEnvSchema.parse(env);

const getAppConfig = (env = process.env) => {
    const normalizedEnv = normalizeEnv(env);
    const runtimeEnv = normalizedEnv.NODE_ENV;

    return {
        server: {
            env: runtimeEnv,
            port: normalizedEnv.PORT,
            logLevel: normalizedEnv.LOG_LEVEL || (runtimeEnv === 'production' ? 'info' : 'debug'),
        },
        database: {
            uri: normalizedEnv.MONGODB_URI,
        },
        auth: {
            jwtSecret: normalizedEnv.JWT_SECRET,
            jwtRefreshSecret: normalizedEnv.JWT_REFRESH_SECRET || normalizedEnv.JWT_SECRET,
            accessTokenTtl: normalizedEnv.ACCESS_TOKEN_TTL || '15m',
            refreshTokenTtl: normalizedEnv.REFRESH_TOKEN_TTL || '7d',
        },
        admin: {
            email: normalizedEnv.ADMIN_EMAIL,
            password: normalizedEnv.ADMIN_PASSWORD,
        },
        email: {
            user: normalizedEnv.EMAIL_USER,
            pass: normalizedEnv.EMAIL_PASS,
            isConfigured: Boolean(normalizedEnv.EMAIL_USER && normalizedEnv.EMAIL_PASS),
        },
        cloudinary: {
            cloudName: normalizedEnv.CLOUDINARY_NAME,
            apiKey: normalizedEnv.CLOUDINARY_API_KEY,
            apiSecret: normalizedEnv.CLOUDINARY_SECRET_KEY,
            isConfigured: Boolean(
                normalizedEnv.CLOUDINARY_NAME
                && normalizedEnv.CLOUDINARY_API_KEY
                && normalizedEnv.CLOUDINARY_SECRET_KEY
            ),
        },
        security: {
            corsOrigins: parseList(normalizedEnv.CORS_ORIGINS),
            frontendUrl: normalizedEnv.FRONTEND_URL,
            adminUrl: normalizedEnv.ADMIN_URL,
            clientUrl: normalizedEnv.CLIENT_URL,
            appUrl: normalizedEnv.APP_URL,
            cookieDomain: normalizedEnv.COOKIE_DOMAIN,
            cookieSameSite: normalizedEnv.COOKIE_SAME_SITE,
            cookieSecure: normalizedEnv.COOKIE_SECURE,
        },
    };
};

const validateRuntimeConfig = (env = process.env) => {
    const normalizedEnv = normalizeEnv(env);
    const validation = requiredRuntimeSchema.safeParse(normalizedEnv);

    if (!validation.success) {
        const issues = validation.error.issues.map((issue) => issue.message);
        throw new Error(`Invalid runtime configuration: ${issues.join('; ')}`);
    }

    const config = getAppConfig(normalizedEnv);
    const warnings = [];

    if (!config.email.isConfigured) {
        warnings.push('Email delivery is disabled until EMAIL_USER and EMAIL_PASS are configured.');
    }

    if (!config.cloudinary.isConfigured) {
        warnings.push('Cloudinary uploads are disabled until CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_SECRET_KEY are configured.');
    }

    return { config, warnings };
};

export { getAppConfig, validateRuntimeConfig };
