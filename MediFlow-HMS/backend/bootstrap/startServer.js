import createApp from '../app/createApp.js';
import { validateRuntimeConfig } from '../config/appConfig.js';
import { logger } from '../config/logger.js';
import { createGracefulShutdown } from './gracefulShutdown.js';
import { initializeInfrastructure, shutdownInfrastructure } from './infrastructure.js';

const listen = (app, port) => new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server));
    server.on('error', reject);
});

const startServer = async ({ env = process.env, port, enableStaticAssets = true } = {}) => {
    const { config, warnings } = validateRuntimeConfig(env);
    warnings.forEach((warning) => logger.warn(warning));

    await initializeInfrastructure();

    const app = createApp({ enableStaticAssets });
    const resolvedPort = port || config.server.port;

    try {
        const server = await listen(app, resolvedPort);
        const shutdown = createGracefulShutdown({
            server,
            onShutdown: [shutdownInfrastructure],
        });

        logger.info(`Server started on PORT:${resolvedPort}`);

        return {
            app,
            server,
            shutdown,
            config,
        };
    } catch (error) {
        await shutdownInfrastructure();
        throw error;
    }
};

export default startServer;
