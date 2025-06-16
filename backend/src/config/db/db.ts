import mongoose from "mongoose";
import { DB_NAME } from "../../dbname.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(` \n MongoDB connected ! DB host: ${connectionInstance.connection.host}`);
        console.log("connected to MongoDB successfully");
        console.log("CONFIDENCE TOO BAD");
        
        
    } catch (error) {
        console.error("MongoDB connection error", error);
        process.exit(1);
    }
}

export default connectDB;