const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Command = require("../models/Command");
const Order = require("../models/Order");
const Ticket = require("../models/Tickets");
const path = require('path');
const multer = require('multer');

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
    // ensure the auth middleware already attached req.user
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin access required' });
    }

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

// ----------------------------
// Admin: Dashboard statistics
// ----------------------------
router.get('/stats', async (req, res) => {
  try {
    // prefer Order model for revenue/amounts; fallback to Command count
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

// ----------------------------
// Admin: Recent orders
// ----------------------------
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

// ----------------------------
// Admin: Orders (with optional status filter)
// ----------------------------
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

// ----------------------------
// Admin: Tickets
// ----------------------------
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

// ----------------------------
// Admin: Images (collect from Product documents)
// ----------------------------
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

module.exports = router;

