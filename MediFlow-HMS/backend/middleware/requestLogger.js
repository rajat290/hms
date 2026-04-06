import morgan from 'morgan';
import { requestLogStream } from '../config/logger.js';

const requestLogger = morgan(':method :url :status :response-time ms - :res[content-length]', {
    stream: requestLogStream,
    skip: (req) => (
        process.env.NODE_ENV === 'test'
        || req.path === '/api/health'
        || req.path === '/api/v1/health'
    ),
});

export default requestLogger;
