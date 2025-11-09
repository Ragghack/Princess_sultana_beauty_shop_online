const router = require('express').Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "dwhdzbdgk",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "852452928454378",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "ArNOx4peybHbVOEKgIHGt24mpXk"
});

// Update multer configuration to handle multiple files with the correct field name
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    files: 4, // Maximum 4 files
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ 
      folder: 'hairshop',
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto" },
        { format: "webp" }
      ]
    }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// GET all products
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

// POST create product with multiple images - FIXED FIELD NAME
// POST create product with multiple images - CHANGE TO 'images'
router.post('/', auth, upload.array('images', 4), async (req, res) => {
  try {
    console.log('📥 Received product creation request');
    console.log('📁 Files received:', req.files ? req.files.length : 0);
    console.log('📝 Body fields:', Object.keys(req.body));

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const images = [];
    
    // Upload all images to Cloudinary
    if (req.files && req.files.length > 0) {
      console.log('☁️ Uploading images to Cloudinary...');
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          const result = await uploadToCloudinary(file.buffer);
          images.push({
            url: result.secure_url,
            altText: req.body[`imageAltText${i}`] || `Image ${i + 1} of ${req.body.name}`,
            isPrimary: i === 0 // First image is primary by default
          });
          console.log(`✅ Image ${i + 1} uploaded: ${result.secure_url}`);
        } catch (uploadError) {
          console.error(`❌ Failed to upload image ${i + 1}:`, uploadError);
          return res.status(500).json({ error: `Failed to upload image ${i + 1}` });
        }
      }
    } else {
      console.log('ℹ️ No images provided for this product');
    }

    const { name, description, category, price, retailPrice, retailQuantity, tag, status, bulkQuantity, bulkUnit } = req.body;

    // Validate required fields
    if (!name || !description || !category || !retailPrice) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, description, category, retailPrice' 
      });
    }

    console.log('💾 Creating product in database...');
    
    const product = await Product.create({
      name,
      description,
      category,
      price: Number(price || retailPrice),
      retailPrice: Number(retailPrice),
      retailQuantity: Number(retailQuantity || 0),
      tag: tag || 'Premium',
      images,
      status: status || 'active',
      bulkQuantity: bulkQuantity ? Number(bulkQuantity) : undefined,
      bulkUnit: bulkUnit || undefined
    });

    console.log('✅ Product created successfully:', product._id);

    res.status(201).json({ 
      success: true, 
      product,
      message: `Product created successfully with ${images.length} images`
    });
  } catch (err) {
    console.error('❌ Product creation error:', err);
    res.status(500).json({ 
      error: err.message || 'Internal server error during product creation'
    });
  }
});

// PUT update product with multiple images
router.put('/:id', auth, upload.array('productImages', 4), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let updateData = { ...req.body };
    const newImages = [];

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const result = await uploadToCloudinary(file.buffer);
        newImages.push({
          url: result.secure_url,
          altText: req.body[`imageAltText${i}`] || '',
          isPrimary: false
        });
      }
    }

    // If we have new images, replace or append based on request
    if (newImages.length > 0) {
      if (req.body.replaceImages === 'true') {
        updateData.images = newImages;
        if (updateData.images.length > 0) {
          updateData.images[0].isPrimary = true;
        }
      } else {
        // Get existing product to merge images
        const existingProduct = await Product.findById(req.params.id);
        if (existingProduct) {
          updateData.images = [...existingProduct.images, ...newImages];
          // Limit to 4 images total
          if (updateData.images.length > 4) {
            updateData.images = updateData.images.slice(0, 4);
          }
        }
      }
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

// DELETE product
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


module.exports = router;