class ApiError extends Error {
    constructor(message, statusCode = 500, code = 'internal_error', details = null) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

const DEFAULT_SUCCESS_MESSAGE = 'Request completed successfully';
const DEFAULT_ERROR_MESSAGE = 'Request failed';

const extractDataPayload = (payload = {}) => {
    const reservedKeys = new Set(['success', 'message', 'data', 'meta', 'error']);

    return Object.entries(payload).reduce((accumulator, [key, value]) => {
        if (!reservedKeys.has(key)) {
            accumulator[key] = value;
        }

        return accumulator;
    }, {});
};

const buildSuccessPayload = (payload = {}) => {
    const derivedData = payload.data ?? extractDataPayload(payload);

    return {
        success: true,
        message: payload.message || DEFAULT_SUCCESS_MESSAGE,
        data: derivedData,
        ...(payload.meta ? { meta: payload.meta, pagination: payload.meta } : {}),
        ...payload,
    };
};

const buildErrorPayload = (payload = {}, statusCode = 500) => {
    const errorMessage = payload.message || payload.error?.message || DEFAULT_ERROR_MESSAGE;
    const normalizedError = {
        code: payload.error?.code || payload.code || 'request_failed',
        message: errorMessage,
        ...(payload.error?.details || payload.details ? { details: payload.error?.details || payload.details } : {}),
        ...(payload.error?.stack ? { stack: payload.error.stack } : {}),
    };

    return {
        success: false,
        message: errorMessage,
        error: normalizedError,
        statusCode,
        ...payload,
    };
};

const sendSuccess = (res, payload = {}, statusCode = 200) => (
    res.status(statusCode).json(buildSuccessPayload(payload))
);

const sendError = (res, error, statusCode) => {
    const resolvedStatusCode = statusCode || error?.statusCode || 500;
    return res.status(resolvedStatusCode).json(
        buildErrorPayload(
            {
                message: error?.message,
                code: error?.code,
                details: error?.details,
            },
            resolvedStatusCode,
        ),
    );
};

const asyncHandler = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        next(error);
    }
};

export {
    ApiError,
    asyncHandler,
    buildErrorPayload,
    buildSuccessPayload,
    extractDataPayload,
    sendError,
    sendSuccess,
};
