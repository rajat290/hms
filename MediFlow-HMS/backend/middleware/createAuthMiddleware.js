import { verifyAccessTokenSession } from '../utils/authSessions.js';
import { getAccessTokenFromRequest } from '../utils/sessionCookies.js';

const unauthorized = (res, message = 'Not Authorized Login Again') => (
    res.status(401).json({ success: false, message })
);

const createAuthMiddleware = ({ headerName, role, bodyField }) => async (req, res, next) => {
    const rawToken = getAccessTokenFromRequest(req, role, headerName);

    if (!rawToken) {
        return unauthorized(res, 'Not Authorized Login Again');
    }

    try {
        const auth = await verifyAccessTokenSession(rawToken, role);
        req.auth = auth;
        req.body = req.body || {};
        req.body[bodyField] = auth.subjectId;
        next();
    } catch (error) {
        console.log(error);
        const message = error.name === 'TokenExpiredError'
            ? 'Session expired. Please login again.'
            : error.message || 'Not Authorized Login Again';
        return unauthorized(res, message);
    }
};

export default createAuthMiddleware;
