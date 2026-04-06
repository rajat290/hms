import createAuthMiddleware from './createAuthMiddleware.js';

const authDoctor = createAuthMiddleware({
    headerName: 'dtoken',
    role: 'doctor',
    bodyField: 'docId',
});

export default authDoctor;
