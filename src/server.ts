import mongoose from "mongoose";

import runWebSocket from "@/connection/websocket";

import app from "./app";

// Connect mongoDB
console.log("Environment Variable for MongoDB:", process.env.MONGO_DB_URI);
console.log("PORT", process.env.PORT);
console.log("JWT_EXPIRE_IN", process.env.JWT_EXPIRE_IN);
mongoose
  .connect(process.env.MONGO_DB_URI!)
  .then(() => {
    console.log("githubaction success3!");
    console.log("MongoDB is running!");
    const server = app.listen(process.env.PORT!, () => {
      console.log("Server is running again!", process.env.PORT);
      // 執行 WebSocket
      runWebSocket(server);
    });
  })
  .catch((error) => {
    console.log("MongoDB can't connect!", error);
  });

// INFO: Handle uncaughtException and unhandledRejection
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("unhandledRejection:", promise, "reason:", reason);
});
