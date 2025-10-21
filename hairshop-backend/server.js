require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const app = express();

// Middleware
app.use(cors({
    origin: ['http://127.0.0.1:5501', 'http://localhost:3000', 'http://localhost:5501'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("Backend running with MongoDB Atlas!");
});

// Import and use route files
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/user");
app.use("/api/user", userRoutes);

const productRoutes = require("./routes/products");
app.use("/api/products", productRoutes);

const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

const commandRoutes = require("./routes/commands");
app.use("/api/commands", commandRoutes);

// 404 handler - FIXED: Use proper Express syntax
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The requested route ${req.originalUrl} does not exist.`,
    availableRoutes: [
      "/api/auth/*",
      "/api/user/*", 
      "/api/products/*",
      "/api/admin/*",
      "/api/commands/*"
    ]
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error("🚨 Error:", error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: "Validation Error",
      message: Object.values(error.errors).map(err => err.message).join(', ')
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      error: "Duplicate Entry",
      message: `${field} already exists`
    });
  }

  // Default error
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong!"
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

module.exports = app; // For testing purposes