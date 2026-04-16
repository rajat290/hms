import mongoose from 'mongoose';

const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
};

const healthHandler = (req, res) => {
    const dbReadyState = mongoose.connection.readyState;

    res.json({
        success: true,
        message: 'Health check completed',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
        database: {
            readyState: dbReadyState,
            status: readyStateMap[dbReadyState] || 'unknown',
        },
    });
};

export default healthHandler;
