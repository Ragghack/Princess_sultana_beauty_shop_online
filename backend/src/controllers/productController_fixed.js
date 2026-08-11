const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { MongoClient, ObjectId } = require("mongodb");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { generateSKU, generateSlug } = require("../utils/helpers");
const fs = require("fs").promises;

const mongoUrl = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/hairshop";
let mongoClient;
let mongoDb;

async function getMongoDatabase() {
  if (mongoDb) return mongoDb;

  try {
    // Extract the db name via regex instead of the URL class, since
    // standard (non-SRV) connection strings can list multiple
    // comma-separated hosts, which new URL() cannot parse.
    const dbNameMatch = mongoUrl.match(/\/([^/?]+)(\?|$)/);
    const dbName = (dbNameMatch && dbNameMatch[1]) || "hairshop";
    const client = new MongoClient(mongoUrl);
    await client.connect();
    mongoClient = client;
    mongoDb = client.db(dbName);
    return mongoDb;
  } catch (error) {
    mongoClient = null;
    mongoDb = null;
    throw error;
  }
}

function normalizeObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && /^[a-f0-9]{24}$/i.test(id)) {
    return new ObjectId(id);
  }
  return id;
}

function serializeId(value) {
  if (!value) return value;
  if (value instanceof ObjectId) return value.toString();
  return value;
}

class ProductController {
  getProducts = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      search,
      sortBy = "createdAt",
      order = "desc",
      featured,
    } = req.query;

    const database = await getMongoDatabase();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { deletedAt: null };
    if (category) filter.category = category;
    if (status && status !== "ALL") {
      filter.status = status;
    } else if (!status) {
      filter.status = "ACTIVE";
    }
    if (featured === "true") filter.featured = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sort = {};
    sort[sortBy] = order === "asc" ? 1 : -1;

    const [productsRaw, total] = await Promise.all([
      database.collection("products")
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      database.collection("products").countDocuments(filter),
    ]);

    const products = await Promise.all(
      productsRaw.map(async (product) => {
        const images = await database.collection("product_images")
          .find({ productId: product._id })
          .sort({ position: 1 })
          .toArray();

        return {
          ...product,
          id: serializeId(product._id),
          _id: undefined,
          images: images.map((image) => ({
            ...image,
            id: serializeId(image._id),
            _id: undefined,
            productId: serializeId(image.productId),
          })),
          rating: 0,
          reviewCount: 0,
        };
      })
    );

    res.status(200).json(
      new ApiResponse(200, {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      })
    );
  });

  getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const database = await getMongoDatabase();

    const product = await database.collection("products").findOne({
      _id: normalizeObjectId(id),
      deletedAt: null,
    });

    if (!product) throw new ApiError(404, "Produit non trouvé");

    await database.collection("products").updateOne(
      { _id: product._id },
      { $inc: { viewCount: 1 } }
    );

    const images = await database.collection("product_images")
      .find({ productId: product._id })
      .sort({ position: 1 })
      .toArray();

    res.status(200).json(
      new ApiResponse(200, {
        ...product,
        id: serializeId(product._id),
        _id: undefined,
        images: images.map((image) => ({
          ...image,
          id: serializeId(image._id),
          _id: undefined,
          productId: serializeId(image.productId),
        })),
        rating: 0,
        reviewCount: 0,
      })
    );
  });

  getProductBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const database = await getMongoDatabase();

    const product = await database.collection("products").findOne({ slug, deletedAt: null });

    if (!product) throw new ApiError(404, "Produit non trouvé");

    await database.collection("products").updateOne(
      { _id: product._id },
      { $inc: { viewCount: 1 } }
    );

    const images = await database.collection("product_images")
      .find({ productId: product._id })
      .sort({ position: 1 })
      .toArray();

    res.status(200).json(
      new ApiResponse(200, {
        ...product,
        id: serializeId(product._id),
        _id: undefined,
        images: images.map((image) => ({
          ...image,
          id: serializeId(image._id),
          _id: undefined,
          productId: serializeId(image.productId),
        })),
        rating: 0,
        reviewCount: 0,
      })
    );
  });

  getFeaturedProducts = asyncHandler(async (req, res) => {
    const database = await getMongoDatabase();
    const productsRaw = await database.collection("products")
      .find({ featured: true, status: "ACTIVE", deletedAt: null })
      .sort({ salesCount: -1 })
      .limit(8)
      .toArray();

    const products = await Promise.all(
      productsRaw.map(async (product) => {
        const images = await database.collection("product_images")
          .find({ productId: product._id })
          .sort({ position: 1 })
          .toArray();

        return {
          ...product,
          id: serializeId(product._id),
          _id: undefined,
          images: images.map((image) => ({
            ...image,
            id: serializeId(image._id),
            _id: undefined,
            productId: serializeId(image.productId),
          })),
        };
      })
    );

    res.status(200).json(new ApiResponse(200, products));
  });

  createProduct = asyncHandler(async (req, res) => {
    const {
      name, description, shortDescription, category, price,
      compareAtPrice, cost, stockQuantity, lowStockThreshold,
      weight, volume, bundleLength, featured,
    } = req.body;

    const database = await getMongoDatabase();

    if (!name || !category || !price)
      throw new ApiError(400, "Nom, catégorie et prix sont obligatoires");

    if (!req.files || !req.files.featuredImage)
      throw new ApiError(400, "Image principale est obligatoire");

    const sku = generateSKU(name, category);
    const slug = generateSlug(name);
    const featuredImageUrl = `/uploads/products/${req.files.featuredImage[0].filename}`;

    const galleryImagesData = [];
    if (req.files.galleryImages) {
      req.files.galleryImages.forEach((file, index) => {
        galleryImagesData.push({
          url: `/uploads/products/${file.filename}`,
          altText: `${name} - Image ${index + 1}`,
          position: index,
        });
      });
    }

    const now = new Date();
    const productId = new ObjectId();

    const productDoc = {
      _id: productId,
      name,
      sku,
      slug,
      description,
      shortDescription,
      category,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      cost: cost ? parseFloat(cost) : null,
      stockQuantity: parseInt(stockQuantity) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      weight: weight ? parseFloat(weight) : null,
      volume: volume ? parseFloat(volume) : null,
      bundleLength: bundleLength ? String(bundleLength) : null,
      featuredImage: featuredImageUrl,
      status: "ACTIVE",
      deletedAt: null,
      featured: featured === "true" || featured === true,
      viewCount: 0,
      salesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await database.collection("products").insertOne(productDoc);

    if (galleryImagesData.length > 0) {
      const imageDocs = galleryImagesData.map((image, index) => ({
        _id: new ObjectId(),
        productId: productId,
        url: image.url,
        altText: image.altText,
        position: index,
        createdAt: now,
      }));
      await database.collection("product_images").insertMany(imageDocs);
    }

    const createdProduct = {
      ...productDoc,
      id: serializeId(productDoc._id),
      images: galleryImagesData.map((image, index) => ({
        id: new ObjectId().toString(),
        productId: productId.toString(),
        url: image.url,
        altText: image.altText,
        position: index,
        createdAt: now,
      })),
    };

    res.status(201).json(new ApiResponse(201, createdProduct, "Produit créé avec succès"));
  });

  updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const database = await getMongoDatabase();

    const existingProduct = await database.collection("products").findOne({
      _id: normalizeObjectId(id),
      deletedAt: null,
    });
    if (!existingProduct) throw new ApiError(404, "Produit non trouvé");

    const {
      name, description, shortDescription, category, status, price,
      compareAtPrice, cost, stockQuantity, lowStockThreshold,
      weight, volume, bundleLength, featured, keepImages,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (compareAtPrice !== undefined)
      updateData.compareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : null;
    if (cost !== undefined) updateData.cost = cost ? parseFloat(cost) : null;
    if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity);
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold);
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (volume !== undefined) updateData.volume = volume ? parseFloat(volume) : null;
    if (bundleLength !== undefined) updateData.bundleLength = bundleLength ? String(bundleLength) : null;
    if (featured !== undefined) updateData.featured = featured === "true" || featured === true;
    if (name && name !== existingProduct.name) updateData.slug = generateSlug(name);

    if (req.files && req.files.featuredImage) {
      if (existingProduct.featuredImage) {
        try {
          await fs.unlink(path.join(__dirname, "..", existingProduct.featuredImage));
        } catch (err) { /* ignore */ }
      }
      updateData.featuredImage = `/uploads/products/${req.files.featuredImage[0].filename}`;
    }

    if (keepImages !== undefined) {
      const keepIds = JSON.parse(keepImages);
      await database.collection("product_images").deleteMany({
        productId: existingProduct._id,
        _id: { $nin: keepIds.map((item) => normalizeObjectId(item)) },
      });
    }

    if (req.files && req.files.galleryImages) {
      const existingCount = await database.collection("product_images").countDocuments({ productId: existingProduct._id });
      const newImages = req.files.galleryImages.map((file, index) => ({
        _id: new ObjectId(),
        productId: existingProduct._id,
        url: `/uploads/products/${file.filename}`,
        altText: `${name || existingProduct.name} - Image ${existingCount + index + 1}`,
        position: existingCount + index,
        createdAt: new Date(),
      }));
      await database.collection("product_images").insertMany(newImages);
    }

    updateData.updatedAt = new Date();
    await database.collection("products").updateOne({ _id: existingProduct._id }, { $set: updateData });

    const updatedProduct = await database.collection("products").findOne({ _id: existingProduct._id });
    const images = await database.collection("product_images")
      .find({ productId: existingProduct._id })
      .sort({ position: 1 })
      .toArray();

    res.status(200).json(
      new ApiResponse(200, {
        ...updatedProduct,
        id: serializeId(updatedProduct._id),
        _id: undefined,
        images: images.map((image) => ({
          ...image,
          id: serializeId(image._id),
          _id: undefined,
          productId: serializeId(image.productId),
        })),
      }, "Produit mis à jour")
    );
  });

  deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const database = await getMongoDatabase();
    const product = await database.collection("products").findOne({ _id: normalizeObjectId(id) });
    if (!product) throw new ApiError(404, "Produit non trouvé");

    await database.collection("products").updateOne(
      { _id: product._id },
      { $set: { deletedAt: new Date(), updatedAt: new Date() } }
    );

    res.status(200).json(new ApiResponse(200, null, "Produit supprimé"));
  });

  updateInventory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stockQuantity, operation = "set" } = req.body;
    const database = await getMongoDatabase();

    const product = await database.collection("products").findOne({ _id: normalizeObjectId(id) });
    if (!product) throw new ApiError(404, "Produit non trouvé");

    let nextStockQuantity = parseInt(stockQuantity);
    if (operation === "increment") {
      nextStockQuantity = product.stockQuantity + nextStockQuantity;
    } else if (operation === "decrement") {
      nextStockQuantity = product.stockQuantity - nextStockQuantity;
    }

    const updateData = { stockQuantity: nextStockQuantity, updatedAt: new Date() };
    let nextStatus = product.status;
    if (nextStockQuantity === 0) {
      nextStatus = "OUT_OF_STOCK";
    } else if (product.status === "OUT_OF_STOCK") {
      nextStatus = "ACTIVE";
    }
    updateData.status = nextStatus;

    await database.collection("products").updateOne({ _id: product._id }, { $set: updateData });
    const updatedProduct = await database.collection("products").findOne({ _id: product._id });

    res.status(200).json(new ApiResponse(200, updatedProduct, "Inventaire mis à jour"));
  });
}

module.exports = new ProductController();