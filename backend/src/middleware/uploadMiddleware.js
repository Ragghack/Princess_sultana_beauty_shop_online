const multer = require("multer");
const cloudinary = require("../config/cloudinary");

// Only accept image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extOk = allowedTypes.test(file.originalname.toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype);

  if (mimeOk && extOk) {
    return cb(null, true);
  }
  cb(
    new Error(
      "Seules les images sont autorisées (JPEG, JPG, PNG, GIF, WEBP)",
    ),
  );
};

// Helper to build a clean, unique public_id from the original filename
const buildPublicId = (originalname) => {
  const nameWithoutExt = originalname.replace(/\.[^/.]+$/, "");
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "-");
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${sanitized}-${uniqueSuffix}`;
};

/**
 * Minimal multer storage engine that streams the uploaded file
 * straight to Cloudinary — avoids relying on the unmaintained
 * "multer-storage-cloudinary" package, which is stuck requiring
 * cloudinary@^1.x as a peer dependency.
 *
 * After upload, req.file / req.files entries get:
 *   - path      -> Cloudinary secure_url (what we store in MongoDB)
 *   - filename  -> Cloudinary public_id (used later to delete the asset)
 */
class CloudinaryEngine {
  constructor(options) {
    this.folder = options.folder;
    this.publicIdPrefix = options.publicIdPrefix || "";
  }

  _handleFile(req, file, cb) {
    const publicId = `${this.publicIdPrefix}${buildPublicId(file.originalname)}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: this.folder,
        public_id: publicId,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        });
      },
    );

    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, cb) {
    if (!file.filename) return cb(null);
    cloudinary.uploader.destroy(file.filename, (err) => cb(err));
  }
}

// ---- Product images (featured + gallery) ----
const upload = multer({
  storage: new CloudinaryEngine({ folder: "sultana/products" }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter,
});

// Middleware for product image uploads
const uploadProductImages = upload.fields([
  { name: "featuredImage", maxCount: 1 },
  { name: "galleryImages", maxCount: 6 },
]);

// ---- Payment proof uploads ----
const uploadPaymentProof = multer({
  storage: new CloudinaryEngine({
    folder: "sultana/payment-proofs",
    publicIdPrefix: "payment-",
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter,
}).single("paymentProof");

module.exports = {
  upload,
  uploadProductImages,
  uploadPaymentProof,
};
