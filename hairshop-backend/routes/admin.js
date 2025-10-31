const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Command = require("../models/Command");
const Order = require("../models/Order");
const Ticket = require("../models/Tickets");
const path = require('path');
const multer = require('multer');
const authMiddleware = require("../middleware/auth");

// Multer storage configuration for saving uploads to /uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif)$/i;
    if (!allowed.test(path.extname(file.originalname))) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

// ============================
// 🔑 ADMIN ROUTES
// ============================

// Apply authentication middleware to ALL admin routes
router.use(authMiddleware);

// ✅ Add a subscriber (create user with role "customer")
router.post("/add-subscriber", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newUser = new User({
      name,
      email,
      password, // ⚠️ In real app, hash with bcrypt before saving
      role: "customer",
    });

    await newUser.save();
    res.status(201).json({ message: "Subscriber added successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Upload an image and optionally attach it to a product
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { productId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const imagePath = `/uploads/${req.file.filename}`;

    if (productId) {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      product.images = product.images || [];
      product.images.push(imagePath);
      await product.save();

      return res.status(201).json({ message: 'Image uploaded and attached to product', image: imagePath, product });
    }

    // If no productId provided, just return the image path
    res.status(201).json({ message: 'Image uploaded', image: imagePath });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Remove subscriber by ID
router.delete("/remove-subscriber/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "Subscriber not found" });

    res.json({ message: "Subscriber removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update product stock
router.patch("/update-stock/:productId", async (req, res) => {
  try {
    const { stock } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.productId,
      { stock },
      { new: true }
    );
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Stock updated", product: updatedProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ View all commands (orders)
router.get("/commands", async (req, res) => {
  try {
    const commands = await Command.find().populate("userId", "name email");
    res.json(commands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update command status (queue: pending → processing → completed)
router.patch("/update-command/:id", async (req, res) => {
  try {
    const { status } = req.body; // expected: "pending", "processing", "completed"

    const updatedCommand = await Command.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedCommand) return res.status(404).json({ message: "Command not found" });

    res.json({ message: "Command status updated", command: updatedCommand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// 📊 DASHBOARD & STATISTICS
// ============================

// Admin: Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // totalRevenue: sum of Order.amount where amount exists
    const revenueAgg = await Order.aggregate([
      { $match: { amount: { $exists: true, $ne: null } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRevenue = (revenueAgg[0] && revenueAgg[0].total) ? revenueAgg[0].total : 0;

    res.json({ totalOrders, totalUsers, totalProducts, totalRevenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Recent orders
router.get('/orders/recent', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('user', 'name email')
      .populate('items.product', 'name');

    const mapped = orders.map(o => ({
      id: o._id,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      customerName: o.user ? o.user.name : 'Guest',
      customerEmail: o.user ? o.user.email : null,
      customerPhone: o.user ? (o.user.phone || null) : null,
      products: o.items.map(i => `${i.product ? i.product.name : 'Product'} (x${i.qty})`).join(', '),
      amount: o.amount || 0,
      paymentStatus: o.paymentStatus || 'unknown',
      paymentMethod: o.paymentMethod || null,
      status: o.status,
      trackingNumber: o.trackingNumber || null
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Orders (with optional status filter)
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('user', 'name email').populate('items.product', 'name');

    const mapped = orders.map(o => ({
      id: o._id,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      customerName: o.user ? o.user.name : 'Guest',
      customerEmail: o.user ? o.user.email : null,
      customerPhone: o.user ? (o.user.phone || null) : null,
      products: o.items.map(i => `${i.product ? i.product.name : 'Product'} (x${i.qty})`).join(', '),
      amount: o.amount || 0,
      paymentStatus: o.paymentStatus || 'unknown',
      paymentMethod: o.paymentMethod || null,
      status: o.status,
      trackingNumber: o.trackingNumber || null
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// 🛍️ PRODUCT MANAGEMENT
// ============================

// GET all products for admin
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST create new product - FIXED VERSION with authentication
// POST create new product with image upload
router.post('/products', upload.single('productImage'), async (req, res) => {
  try {
    console.log('🎯 Creating product with image:', req.body);
    console.log('📁 File received:', req.file);
    console.log('👤 User making request:', req.user);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Administrator privileges required' 
      });
    }
    
    const { 
      name, 
      description, 
      category, 
      retailPrice, 
      retailQuantity, 
      status,
      bulkQuantity,
      bulkUnit,
      price,
      tag
    } = req.body;

    // Validation
    if (!name || !description || !category) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, description, and category are required' 
      });
    }

    const productPrice = retailPrice || price;
    if (!productPrice) {
      return res.status(400).json({ 
        success: false,
        error: 'Product price is required' 
      });
    }

    // Handle image upload
    let imageURL = null;
    let imageFile = null;

    if (req.file) {
      // Option 1: Store file locally (uploads folder)
      imageURL = `/uploads/${req.file.filename}`;
      imageFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path
      };
      
      console.log('🖼️ Image stored locally:', imageURL);
    } else {
      // Option 2: Use Cloudinary if configured
      // Uncomment below if you want to use Cloudinary
      /*
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await uploadToCloudinary(req.file.buffer);
        imageURL = result.secure_url;
        console.log('☁️ Image uploaded to Cloudinary:', imageURL);
      }
      */
    }

    // Create product data
    const productData = {
      name: name.trim(),
      description: description.trim(),
      category,
      price: parseFloat(productPrice),
      retailPrice: parseFloat(productPrice),
      retailQuantity: parseInt(retailQuantity) || 0,
      status: status || 'active',
      tag: tag || 'New Arrival',
      imageURL: imageURL, // Use uploaded image or null
      imageFile: imageFile // Store file info
    };

    // Add optional fields
    if (bulkQuantity) productData.bulkQuantity = parseInt(bulkQuantity);
    if (bulkUnit) productData.bulkUnit = bulkUnit.trim();

    const product = await Product.create(productData);
    
    console.log('✅ Product created successfully with image:', product.imageURL);
    
    res.status(201).json({ 
      success: true, 
      message: 'Product created successfully',
      product: {
        _id: product._id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        retailPrice: product.retailPrice,
        retailQuantity: product.retailQuantity,
        status: product.status,
        tag: product.tag,
        imageURL: product.imageURL // This will be the uploaded image or null
      }
    });
    
  } catch (error) {
    console.error('💥 Product creation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: errors.join(', ') 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: 'Product with this name already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error: ' + error.message 
    });
  }
});

// Helper function for Cloudinary upload (optional)
async function uploadToCloudinary(buffer) {
  const cloudinary = require('cloudinary').v2;
  const streamifier = require('streamifier');
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sultana-haircare' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// DELETE product
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    res.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete product' 
    });
  }
});

// UPDATE product
router.put('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      product 
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update product' 
    });
  }
});

// ============================
// 🎫 CUSTOMER SUPPORT
// ============================

// Admin: Tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 }).populate('user', 'name email');
    const mapped = tickets.map(t => ({
      id: t._id,
      subject: t.subject,
      priority: t.priority || 'low',
      message: t.message,
      status: t.status,
      orderId: t.orderId,
      customerName: t.user ? t.user.name : 'Guest',
      createdAt: t.createdAt
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// 🖼️ IMAGE MANAGEMENT
// ============================

// Admin: Images (collect from Product documents)
router.get('/images', async (req, res) => {
  try {
    const products = await Product.find().sort({ updatedAt: -1 });
    const images = [];

    products.forEach(prod => {
      // local images stored in product.images (paths like /uploads/..)
      if (Array.isArray(prod.images)) {
        prod.images.forEach((imgPath, idx) => {
          images.push({
            id: `${prod._id}-${idx}`,
            url: imgPath,
            filename: path.basename(imgPath),
            productName: prod.name,
            uploadedAt: prod.updatedAt || prod.createdAt
          });
        });
      }

      // also include primary cloud image (imageURL) if present
      if (prod.imageURL) {
        images.push({
          id: `${prod._id}-primary`,
          url: prod.imageURL,
          filename: prod.imageURL.split('/').pop(),
          productName: prod.name,
          uploadedAt: prod.updatedAt || prod.createdAt
        });
      }
    });

    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// 👤 ADMIN PROFILE & SETTINGS
// ============================

// Get admin profile
router.get('/profile', async (req, res) => {
  try {
    // Get admin user from database
    const adminUser = await User.findById(req.user.userId);
    if (!adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    res.json({
      name: adminUser.name,
      email: adminUser.email,
      phone: adminUser.phone || '+237 6XX XXX XXX',
      companyLogo: null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update admin profile
router.put('/profile', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email, phone },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profile: { 
        name: updatedUser.name, 
        email: updatedUser.email, 
        phone: updatedUser.phone 
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update company logo
router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file uploaded' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      message: 'Logo updated successfully',
      logoUrl 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================
// 💬 COMMENTS & REVIEWS
// ============================

// Admin: Customer comments (placeholder)
router.get('/comments', async (req, res) => {
  try {
    // Placeholder - in real app, fetch from your Comments/Reviews model
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;