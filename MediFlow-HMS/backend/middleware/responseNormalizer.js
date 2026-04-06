import { buildErrorPayload, buildSuccessPayload } from '../utils/apiResponse.js';

const normalizeApiResponse = (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (payload) => {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return originalJson(payload);
        }

        if (payload.success === true) {
            return originalJson(buildSuccessPayload(payload));
        }

        if (payload.success === false) {
            return originalJson(buildErrorPayload(payload, res.statusCode >= 400 ? res.statusCode : 400));
        }

        return originalJson(payload);
    };

    next();
};

export default normalizeApiResponse;
