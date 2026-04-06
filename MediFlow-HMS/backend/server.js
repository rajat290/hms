import express from "express"
import cors from 'cors'
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from "mongoose"
import helmet from "helmet"
import mongoSanitize from "express-mongo-sanitize"
import connectDB from "./config/mongodb.js"
import initializeDatabaseIntegrity from "./config/databaseIntegrity.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import paymentRouter from "./routes/paymentRoute.js"
import staffRouter from "./routes/staffRoute.js"
import aiRouter from "./routes/aiRoute.js"
import initCronJobs from "./jobs/cronJobs.js"
import { corsOptions, helmetOptions } from "./config/security.js"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js"
import sanitizeRequestInput from "./middleware/requestSanitizer.js"
import { apiLimiter } from "./middleware/rateLimiters.js"
import normalizeApiResponse from "./middleware/responseNormalizer.js"
import { validateRuntimeConfig } from "./config/appConfig.js"
import { logger } from "./config/logger.js"
import requestLogger from "./middleware/requestLogger.js"

// app config
const app = express()
const { config, warnings } = validateRuntimeConfig()
const port = config.server.port
const apiRouter = express.Router()

app.set('trust proxy', 1)
app.use(requestLogger)

warnings.forEach((warning) => logger.warn(warning))

try {
  await connectDB()
  await initializeDatabaseIntegrity()
  connectCloudinary()
  logger.info("Infrastructure connections initialized")
} catch (error) {
  logger.error("Failed to connect to required services", { message: error.message })
}

initCronJobs()

// middlewares
app.use("/api/payment", paymentRouter)
app.use("/api/v1/payment", paymentRouter)
app.use(express.json({ limit: '1mb' }))
app.use(cors(corsOptions))
app.use(helmet(helmetOptions))
app.use(mongoSanitize())
app.use(sanitizeRequestInput)
app.use("/api", apiLimiter)
app.use("/api/v1", apiLimiter)
apiRouter.use(normalizeApiResponse)

// api endpoints
const healthHandler = (req, res) => {
  const readyStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  }

  const dbReadyState = mongoose.connection.readyState

  res.json({
    success: true,
    message: "Health check completed",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    database: {
      readyState: dbReadyState,
      status: readyStateMap[dbReadyState] || "unknown",
    },
  })
}

apiRouter.get("/health", healthHandler)
apiRouter.use("/user", userRouter)
apiRouter.use("/admin", adminRouter)
apiRouter.use("/doctor", doctorRouter)
apiRouter.use("/staff", staffRouter)
apiRouter.use("/ai", aiRouter)

app.use("/api", apiRouter)
app.use("/api/v1", apiRouter)

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/")) {
    return notFoundHandler(req, res, next)
  }

  next()
})

// Serve PWA files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get("/sw.js", (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/sw.js'));
});

app.get("/manifest.json", (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/manifest.json'));
});

app.get("/", (req, res) => {
  res.send("API Working")
});

app.use(errorHandler)

app.listen(port, () => logger.info(`Server started on PORT:${port}`))
