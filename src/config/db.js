import mongoose from "mongoose";
import { config } from "./env.js";

let isConnected = false;

export async function connectDB() {
  if (!config.mongodbUri) {
    console.warn(
      "⚠️  [Database] MONGODB_URI is not defined. Running with in-memory storage fallback for local development.",
    );
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true,
    });

    isConnected = true;
    console.log(`✅ [Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ [Database] MongoDB Connection Error: ${error.message}`);
    console.warn(
      "⚠️  [Database] Falling back to in-memory store so the server remains responsive.",
    );
    return false;
  }
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("⚠️  [Database] MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  console.log("✅ [Database] MongoDB reconnected.");
});

