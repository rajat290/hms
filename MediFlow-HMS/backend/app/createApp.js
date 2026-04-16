import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { corsOptions, helmetOptions } from '../config/security.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import { apiLimiter } from '../middleware/rateLimiters.js';
import requestLogger from '../middleware/requestLogger.js';
import sanitizeRequestInput from '../middleware/requestSanitizer.js';
import paymentRouter from '../routes/paymentRoute.js';
import createApiRouter from './createApiRouter.js';
import { registerStaticAssets } from './registerStaticAssets.js';

const createApp = ({ enableStaticAssets = true } = {}) => {
    const app = express();
    const apiRouter = createApiRouter();

    app.set('trust proxy', 1);
    app.use(requestLogger);

    app.use('/api/payment', paymentRouter);
    app.use('/api/v1/payment', paymentRouter);

    app.use(express.json({ limit: '1mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetOptions));
    app.use(mongoSanitize());
    app.use(sanitizeRequestInput);
    app.use('/api', apiLimiter);
    app.use('/api/v1', apiLimiter);

    app.use('/api', apiRouter);
    app.use('/api/v1', apiRouter);

    app.use((req, res, next) => {
        if (req.originalUrl.startsWith('/api/')) {
            return notFoundHandler(req, res, next);
        }

        return next();
    });

    if (enableStaticAssets) {
        registerStaticAssets(app);
    }

    app.get('/', (req, res) => {
        res.send('API Working');
    });

    app.use(errorHandler);

    return app;
};

export default createApp;
