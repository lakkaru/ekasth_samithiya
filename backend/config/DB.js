const mongoose = require('mongoose');
require('dotenv').config(); // Loads environment variables

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[DB] Connected to database: ${conn.connection.name} on host: ${conn.connection.host}`);
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;