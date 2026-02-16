import mongoose from "mongoose";

const connectDB = async () => {

    mongoose.connection.on('connected', () => console.log("Database Connected"))
    mongoose.connection.on('error', (err) => console.log("Database Connection Error:", err))
    mongoose.connection.on('disconnected', () => console.log("Database Disconnected"))

    await mongoose.connect(`${process.env.MONGODB_URI}`)
}

export default connectDB;