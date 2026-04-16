import express from 'express';
import adminRouter from '../routes/adminRoute.js';
import aiRouter from '../routes/aiRoute.js';
import doctorRouter from '../routes/doctorRoute.js';
import staffRouter from '../routes/staffRoute.js';
import userRouter from '../routes/userRoute.js';
import normalizeApiResponse from '../middleware/responseNormalizer.js';
import healthHandler from './healthHandler.js';

const createApiRouter = () => {
    const apiRouter = express.Router();

    apiRouter.use(normalizeApiResponse);
    apiRouter.get('/health', healthHandler);
    apiRouter.use('/user', userRouter);
    apiRouter.use('/admin', adminRouter);
    apiRouter.use('/doctor', doctorRouter);
    apiRouter.use('/staff', staffRouter);
    apiRouter.use('/ai', aiRouter);

    return apiRouter;
};

export default createApiRouter;
