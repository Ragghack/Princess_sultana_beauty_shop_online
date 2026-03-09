require("dotenv").config();
const app = require("./app");
const prisma = require("./config/database");

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(async () => {
    console.log("💥 Process terminated!");
    await prisma.$disconnect();
  });
});
