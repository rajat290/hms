import winston from 'winston';
import { getAppConfig } from './appConfig.js';

const { combine, colorize, errors, json, printf, splat, timestamp } = winston.format;
const { server } = getAppConfig();
const isTestEnvironment = server.env === 'test';

const consoleFormat = server.env === 'production'
    ? combine(timestamp(), errors({ stack: true }), splat(), json())
    : combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        splat(),
        printf(({ level, message, timestamp: logTimestamp, stack, ...metadata }) => {
            const serializedMetadata = Object.keys(metadata).length > 0
                ? ` ${JSON.stringify(metadata)}`
                : '';
            return `${logTimestamp} ${level}: ${stack || message}${serializedMetadata}`;
        }),
    );

const logger = winston.createLogger({
    level: server.logLevel,
    defaultMeta: { service: 'mediflow-hms-backend' },
    transports: [
        new winston.transports.Console({
            silent: isTestEnvironment,
            format: consoleFormat,
        }),
    ],
});

const requestLogStream = {
    write(message) {
        logger.http(message.trim());
    },
};

export {
    logger,
    requestLogStream,
};
