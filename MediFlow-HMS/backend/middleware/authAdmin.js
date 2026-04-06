import createAuthMiddleware from './createAuthMiddleware.js';

const authAdmin = createAuthMiddleware({
    headerName: 'atoken',
    role: 'admin',
    bodyField: 'adminId',
});

export default authAdmin;
