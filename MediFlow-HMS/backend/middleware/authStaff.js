import createAuthMiddleware from './createAuthMiddleware.js';

const authStaff = createAuthMiddleware({
    headerName: 'stoken',
    role: 'staff',
    bodyField: 'staffId',
});

export default authStaff;
