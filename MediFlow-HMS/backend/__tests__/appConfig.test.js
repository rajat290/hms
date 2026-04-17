import { getAppConfig, validateRuntimeConfig } from '../config/appConfig.js';

describe('appConfig', () => {
  it('normalizes runtime settings and comma-separated origin lists', () => {
    const config = getAppConfig({
      NODE_ENV: 'production',
      PORT: '5055',
      LOG_LEVEL: 'warn',
      MONGODB_URI: 'mongodb://localhost:27017/mediflow',
      JWT_SECRET: 'jwt-secret',
      ADMIN_EMAIL: 'admin@mediflow.test',
      ADMIN_PASSWORD: 'super-secret',
      ACCESS_TOKEN_TTL: '20m',
      REFRESH_TOKEN_TTL: '14d',
      EMAIL_USER: 'mail@mediflow.test',
      EMAIL_PASS: 'email-password',
      CORS_ORIGINS: 'https://one.test, https://two.test',
      FRONTEND_URL: 'https://patient.mediflow.test',
      COOKIE_DOMAIN: '.mediflow.test',
      COOKIE_SAME_SITE: 'strict',
      COOKIE_SECURE: 'true',
    });

    expect(config.server).toEqual({
      env: 'production',
      port: 5055,
      logLevel: 'warn',
    });
    expect(config.auth.accessTokenTtl).toBe('20m');
    expect(config.auth.refreshTokenTtl).toBe('14d');
    expect(config.security.corsOrigins).toEqual(['https://one.test', 'https://two.test']);
    expect(config.security.frontendUrl).toBe('https://patient.mediflow.test');
    expect(config.security.cookieDomain).toBe('.mediflow.test');
    expect(config.security.cookieSameSite).toBe('strict');
    expect(config.security.cookieSecure).toBe(true);
  });

  it('fails validation when required environment variables are missing', () => {
    expect(() => validateRuntimeConfig({})).toThrow(
      'Invalid runtime configuration: MONGODB_URI is required; JWT_SECRET is required; ADMIN_EMAIL is required; ADMIN_PASSWORD is required'
    );
  });

  it('returns startup warnings for optional integrations that are not configured', () => {
    const { warnings } = validateRuntimeConfig({
      MONGODB_URI: 'mongodb://localhost:27017/mediflow',
      JWT_SECRET: 'jwt-secret',
      ADMIN_EMAIL: 'admin@mediflow.test',
      ADMIN_PASSWORD: 'super-secret',
    });

    expect(warnings).toContain('Email delivery is disabled until EMAIL_USER and EMAIL_PASS are configured.');
    expect(warnings).toContain('Cloudinary uploads are disabled until CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_SECRET_KEY are configured.');
  });
});
