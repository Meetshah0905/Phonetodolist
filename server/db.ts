import mongoose from "mongoose";
import { log } from "./index";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/read-open";

export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    log(`Connected to MongoDB at ${MONGODB_URI}`, "mongodb");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
}
