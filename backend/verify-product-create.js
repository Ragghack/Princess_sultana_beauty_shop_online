require('dotenv').config({ path: '.env' });
const controller = require('./src/controllers/productController_fixed');

(async () => {
  const req = {
    body: {
      name: 'Test Product',
      description: 'Created via verification',
      shortDescription: 'Short desc',
      category: 'HAIR_OIL',
      price: '2500',
      compareAtPrice: '3000',
      cost: '1800',
      stockQuantity: '10',
      lowStockThreshold: '3',
      weight: '0.2',
      volume: '100',
      bundleLength: '1',
      featured: false,
    },
    files: {
      featuredImage: [{ filename: 'test-featured.jpg' }],
      galleryImages: [{ filename: 'test-1.jpg' }, { filename: 'test-2.jpg' }],
    },
  };

  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      console.log(JSON.stringify(data, null, 2));
    },
  };

  try {
    await controller.createProduct(req, res);
    console.log('STATUS', res.statusCode);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
