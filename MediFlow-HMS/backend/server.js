import 'dotenv/config'
import { logger } from "./config/logger.js"
import startServer from "./bootstrap/startServer.js"

const registerProcessHandlers = (shutdown) => {
  const exitGracefully = async (signal, exitCode = 0) => {
    try {
      await shutdown(signal)
      process.exit(exitCode)
    } catch (error) {
      logger.error("Error during shutdown", {
        signal,
        message: error.message,
      })
      process.exit(1)
    }
  }

  process.once('SIGINT', () => {
    void exitGracefully('SIGINT')
  })

  process.once('SIGTERM', () => {
    void exitGracefully('SIGTERM')
  })

  process.once('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      message: reason?.message || String(reason),
    })
    void exitGracefully('unhandledRejection', 1)
  })

  process.once('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      message: error.message,
      stack: error.stack,
    })
    void exitGracefully('uncaughtException', 1)
  })
}

try {
  const { shutdown } = await startServer()
  registerProcessHandlers(shutdown)
} catch (error) {
  logger.error('Server failed to start', {
    message: error.message,
    stack: error.stack,
  })
  process.exit(1)
}
