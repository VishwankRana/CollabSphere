import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../db.js";
import Question from "../models/Question.js";
import { SEED_QUESTIONS } from "./seedQuestionsData.js";

dotenv.config();

async function seed() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    const existingCount = await Question.countDocuments({ source: "seed" });

    if (existingCount > 0) {
      console.log(`Seed questions already exist (${existingCount} found). Skipping.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    await Question.insertMany(SEED_QUESTIONS);
    console.log(`Seeded ${SEED_QUESTIONS.length} questions successfully.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
