import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDB = async () => {
    try{
        if(!ENV.DB_URL) throw new Error("Database URL is not defined in the environment variables.");
        const conn=await mongoose.connect(ENV.DB_URL);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }catch(err){
        console.error(`Error: ${err.message}`);
        process.exit(1);    
    }
    };