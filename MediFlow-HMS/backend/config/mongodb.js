import mongoose from "mongoose";
import { getAppConfig } from "./appConfig.js";
import { logger } from "./logger.js";

let connectionListenersRegistered = false;

const registerConnectionListeners = () => {
    if (connectionListenersRegistered) {
        return;
    }

    connectionListenersRegistered = true;

    mongoose.connection.on('connected', () => logger.info("Database connected"));
    mongoose.connection.on('error', (error) => logger.error("Database connection error", { message: error.message }));
    mongoose.connection.on('disconnected', () => logger.warn("Database disconnected"));
};

const connectDB = async () => {
    const { database } = getAppConfig();

    registerConnectionListeners();
    await mongoose.connect(database.uri);
}

export default connectDB;
