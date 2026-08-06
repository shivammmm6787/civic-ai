import http from "http";
import app from "./app.js";
import connectDB from "./database/db.js";
import { env } from "./config/env.js";

const startServer = async () => {
  try {
    // Connect Database
    await connectDB();

    // Create HTTP Server
    const server = http.createServer(app);

    server.listen(env.PORT, () => {
      console.log("=================================");
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log("=================================");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();