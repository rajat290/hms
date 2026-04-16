import { logger } from '../config/logger.js';

const closeHttpServer = (server) => new Promise((resolve, reject) => {
    if (!server || !server.listening) {
        resolve();
        return;
    }

    server.close((error) => {
        if (error) {
            reject(error);
            return;
        }

        resolve();
    });
});

const createGracefulShutdown = ({ server, onShutdown = [] }) => {
    let shutdownPromise = null;

    return async (signal = 'manual') => {
        if (shutdownPromise) {
            return shutdownPromise;
        }

        shutdownPromise = (async () => {
            logger.info('Graceful shutdown started', { signal });

            await closeHttpServer(server);

            const results = await Promise.allSettled(
                onShutdown.map((handler) => Promise.resolve(handler(signal))),
            );

            const rejected = results.filter((result) => result.status === 'rejected');
            if (rejected.length > 0) {
                rejected.forEach((result) => {
                    logger.error('Shutdown handler failed', {
                        signal,
                        message: result.reason?.message || String(result.reason),
                    });
                });
                throw rejected[0].reason;
            }

            logger.info('Graceful shutdown completed', { signal });
        })();

        return shutdownPromise;
    };
};

export { closeHttpServer, createGracefulShutdown };
