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

// GET all products
router.get('/', async (req, res) => {
  const prods = await Product.find().sort({ createdAt: -1 });
  res.json(prods);
});

// POST create product (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    let imageURL = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageURL = result.secure_url;
    }
    const { name, description, category, price, stock } = req.body;
    const product = await Product.create({ name, description, category, price: Number(price), stock: Number(stock), imageURL });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
