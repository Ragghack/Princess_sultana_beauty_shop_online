require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
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
const productRoutes = require("./routes/products");
app.use("/api/products", productRoutes);
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);
const commandRoutes = require("./routes/commands");
app.use("/api/commands", commandRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
