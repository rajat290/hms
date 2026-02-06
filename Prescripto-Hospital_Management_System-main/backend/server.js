import express from "express"
import cors from 'cors'
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import paymentRouter from "./routes/paymentRoute.js"
import staffRouter from "./routes/staffRoute.js"
import initCronJobs from "./jobs/cronJobs.js"

// app config
const app = express()
const port = process.env.PORT || 4000

try {
  await connectDB()
  connectCloudinary()
  console.log("Infrastructure connections initialized")
} catch (error) {
  console.error("Failed to connect to required services:", error.message)
}

initCronJobs()

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/payment", paymentRouter)
app.use("/api/staff", staffRouter)

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

app.listen(port, () => console.log(`Server started on PORT:${port}`))