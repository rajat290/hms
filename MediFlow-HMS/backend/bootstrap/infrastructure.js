import mongoose from 'mongoose';
import initializeDatabaseIntegrity from '../config/databaseIntegrity.js';
import connectCloudinary from '../config/cloudinary.js';
import connectDB from '../config/mongodb.js';
import { logger } from '../config/logger.js';
import initCronJobs, { stopCronJobs } from '../jobs/cronJobs.js';

let infrastructureInitialized = false;

const initializeInfrastructure = async () => {
    if (infrastructureInitialized) {
        return;
    }

    await connectDB();
    await initializeDatabaseIntegrity();
    await connectCloudinary();
    initCronJobs();

    infrastructureInitialized = true;
    logger.info('Infrastructure connections initialized');
};

const shutdownInfrastructure = async () => {
    stopCronJobs();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        logger.info('Database connection closed');
    }

    infrastructureInitialized = false;
};

export { initializeInfrastructure, shutdownInfrastructure };
