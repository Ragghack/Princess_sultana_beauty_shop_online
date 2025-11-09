require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');

const app = express();

// Middleware - MUST come before routes
// ✅ ENHANCED CORS CONFIG
app.use(cors({
    origin: [
        'http://127.0.0.1:5501', 
        'http://localhost:3000', 
        'http://localhost:5501',
        'http://localhost:5000',
        'http://127.0.0.1:5000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ REQUEST LOGGING MIDDLEWARE
app.use((req, res, next) => {
    console.log('🔍', new Date().toISOString(), req.method, req.url);
    console.log('   Origin:', req.headers.origin);
    console.log('   Body:', req.body);
    next();
});

app.use(express.json()); // ✅ This must come BEFORE routes

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ QUICK FIX: DIRECT ADMIN REGISTRATION ENDPOINT
app.post("/api/admin/register", async (req, res) => {
  try {
    console.log('🎯 Admin registration attempt:', req.body);
    
    const bcrypt = require('bcrypt');
    const User = require('./models/User');
    
    const { name, email, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists with this email' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });
    
    await adminUser.save();
    
    console.log('✅ Admin created successfully:', adminUser.email);
    
    // Generate token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      message: 'Admin account created successfully',
      token: token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
    
  } catch (error) {
    console.error('💥 Admin registration error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// TEMPORARY ADMIN CREATION ENDPOINT
app.post("/api/create-admin", async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const User = require('./models/User');
    
    const { name, email, password } = req.body;
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ email, role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }
    
    // Hash password and create admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });
    
    res.json({ 
      success: true, 
      message: 'Admin created successfully',
      user: { id: adminUser._id, email: adminUser.email, role: adminUser.role }
    });
    
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Add this to server.js before the 404 handler
app.get("/api/products-debug", async (req, res) => {
  try {
    const Product = require('./models/Product');
    const products = await Product.find().sort({ createdAt: -1 });
    
    console.log('🔍 Products found:', products.length);
    products.forEach((p, i) => {
      console.log(`Product ${i}:`, {
        id: p._id,
        name: p.name,
        hasImages: p.images && p.images.length > 0,
        imageURL: p.imageURL,
        price: p.price
      });
    });
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});
// ============================
// 🛣️ ROUTES CONFIGURATION - FIXED
// ============================

// ✅ Import routes (ONCE)
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/products");
const commandRoutes = require("./routes/commands");
const adminRoutes = require("./routes/admin"); // ✅ Only one declaration
const authMiddleware = require("./middleware/auth");

// ✅ MOUNT ALL ROUTES PROPERLY
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/commands", commandRoutes);

// ✅ Use admin routes (choose one option below):

// OPTION 1: Without authentication for testing
//app.use("/api/admin", adminRoutes);

// OPTION 2: With authentication (comment out above line and uncomment below)
app.use("/api/admin", authMiddleware, adminRoutes);

// ============================
// 🧪 TEST ENDPOINTS
// ============================

// Test route to verify server is working
app.get("/", (req, res) => {
  res.send("Backend running with MongoDB Atlas!");
});

// Test endpoint for debugging
app.post("/api/test-register", (req, res) => {
    console.log("Test register endpoint hit:", req.body);
    res.json({ 
        message: "Test endpoint works!", 
        received: req.body,
        timestamp: new Date().toISOString()
    });
});

// Admin test endpoint
app.get("/api/admin/test", (req, res) => {
  res.json({ message: "Admin routes are working!" });
});

// Debug endpoints
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.post('/api/debug/register', (req, res) => {
  console.log('Debug register body:', req.body);
  res.json({ 
    success: true,
    message: 'Debug endpoint works!',
    received: req.body
  });
});

// User test endpoint
app.get('/api/test-user', authMiddleware, async (req, res) => {
    try {
        const User = require('./models/User');
        const user = await User.findById(req.user.userId).select('-password');
        res.json({
            message: 'User data test',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            tokenInfo: req.user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================
// 🛠️ TEMPORARY FIXES (Remove after routes are working)
// ============================

// Temporary admin products endpoint (remove after admin routes work)
app.post("/api/admin/products-temp", async (req, res) => {
  try {
    console.log('🎯 Temporary product creation:', req.body);
    
    const Product = require('./models/Product');
    const { name, description, retailPrice, category, retailQuantity, status } = req.body;
    
    // Create product with proper field mapping
    const product = await Product.create({
      name,
      description,
      price: parseFloat(retailPrice), // Map retailPrice to price
      category,
      retailPrice: parseFloat(retailPrice),
      retailQuantity: parseInt(retailQuantity) || 0,
      status: status || 'active',
      tag: 'New Arrival',
      imageURL: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    });
    
    console.log('✅ Temporary product created:', product._id);
    
    res.json({ 
      success: true, 
      message: 'Product created successfully (temp)',
      product 
    });
    
  } catch (error) {
    console.error('💥 Temporary product creation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Debug product endpoint
app.post("/api/admin/products-debug", (req, res) => {
  console.log('🔍 Debug product creation:', req.body);
  res.json({ 
    success: true, 
    message: 'Debug endpoint works!',
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// ============================
// 🚨 ERROR HANDLING
// ============================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The requested route ${req.originalUrl} does not exist.`,
    method: req.method,
    availableRoutes: [
      "GET /",
      "POST /api/auth/register",
      "POST /api/auth/login", 
      "GET /api/auth/me",
      "POST /api/test-register",
      "GET /api/admin/test",
      "POST /api/admin/products-temp"
    ]
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error("🚨 Error:", error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: "Validation Error",
      message: Object.values(error.errors).map(err => err.message).join(', ')
    });
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      error: "Duplicate Entry",
      message: `${field} already exists`
    });
  }
  
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong!"
  });
});

// ============================
// 🚀 SERVER START
// ============================

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  console.log(`✅ Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/admin/products-temp`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/test`);
  console.log('📁 Static files serving from:', path.join(__dirname, 'uploads'));
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});
// Error handling middleware for Multer
// Add this error handling middleware after your routes
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: `Unexpected field: ${error.field}. Please use 'images' as field name for file uploads.`
      });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  next(error);
});

module.exports = app;