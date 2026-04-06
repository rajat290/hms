import createAuthMiddleware from './createAuthMiddleware.js';

const authUser = createAuthMiddleware({
    headerName: 'token',
    role: 'user',
    bodyField: 'userId',
});

export default authUser;
