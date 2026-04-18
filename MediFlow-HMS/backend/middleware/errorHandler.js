import { ApiError, sendError } from '../utils/apiResponse.js';

const notFoundHandler = (req, res, next) => {
    next(new ApiError(`Route not found: ${req.originalUrl}`, 404, 'route_not_found'));
};

const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if ((error?.statusCode || 500) >= 500) {
        logger.error(error);
    }

    return sendError(res, error, error?.statusCode || 500);
};

export {
    errorHandler,
    notFoundHandler,
};
