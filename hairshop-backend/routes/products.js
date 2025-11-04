const router = require('express').Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'hairshop' }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// GET all products (for both shop and admin)
router.get('/', async (req, res) => {
  try {
    const prods = await Product.find().sort({ createdAt: -1 });
    res.json(prods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product (admin only) - USE THIS SINGLE ROUTE
// In your products.js route file, modify the POST route:
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let imageURL = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageURL = result.secure_url; // This gives you a full URL like "https://res.cloudinary.com/..."
    }

    const { name, description, category, price, retailPrice, retailQuantity, tag, status, bulkQuantity, bulkUnit } = req.body;

    const product = await Product.create({
      name,
      description,
      category,
      price: Number(price),
      retailPrice: Number(retailPrice || price),
      retailQuantity: Number(retailQuantity || 0),
      tag: tag || 'Premium',
      imageURL, // This should now be a full Cloudinary URL
      status: status || 'active',
      bulkQuantity: bulkQuantity ? Number(bulkQuantity) : undefined,
      bulkUnit: bulkUnit || undefined
    });

    // Don't send imageFile to frontend
    const productResponse = product.toObject();
    delete productResponse.imageFile; // Remove the imageFile field
    
    res.status(201).json({ 
      success: true, 
      product: productResponse 
    });
  } catch (err) {
    console.error('Product creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update product (admin only)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let updateData = { ...req.body };

    // Handle image upload if new image provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updateData.imageURL = result.secure_url;
    }

    // Convert number fields
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.retailPrice) updateData.retailPrice = Number(updateData.retailPrice);
    if (updateData.stock) updateData.stock = Number(updateData.stock);
    if (updateData.retailQuantity) updateData.retailQuantity = Number(updateData.retailQuantity);
    if (updateData.wholesalePrice) updateData.wholesalePrice = Number(updateData.wholesalePrice);
    if (updateData.bulkQuantity) updateData.bulkQuantity = Number(updateData.bulkQuantity);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REMOVE the duplicate route - delete this entire block:
// router.post('/admin/products', auth, upload.single('image'), async (req, res) => {
//   ... duplicate code ...
// });

module.exports = router;