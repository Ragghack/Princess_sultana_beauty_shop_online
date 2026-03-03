const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { generateSKU, generateSlug } = require("../utils/helpers");
const path = require("path");
const fs = require("fs").promises;

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { deletedAt: null };

    if (category) where.category = category;

    // FIX 1: "ALL" is not a valid Prisma enum — never pass it to the where clause
    if (status && status !== "ALL") {
      where.status = status;
    } else if (!status) {
      where.status = "ACTIVE"; // public default
    }
    // status === "ALL" → no status filter → admin sees everything

    if (featured === "true") where.featured = true;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: {
          images: { orderBy: { position: "asc" } },
          reviews: {
            where: { isApproved: true },
            select: { rating: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // DIAGNOSTIC — remove once products are confirmed visible
    console.log("where:", JSON.stringify(where));
    console.log("total:", total, "| returned:", products.length);

    // FIX 2: Guard against reviews being null/undefined
    const productsWithRating = products.map((product) => {
      const ratings = (product.reviews || []).map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;
      return {
        ...product,
        rating: avgRating,
        reviewCount: ratings.length,
        reviews: undefined,
      };
    });

    res.status(200).json(
      new ApiResponse(200, {
        products: productsWithRating,
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product || product.deletedAt) throw new ApiError(404, "Produit non trouvé");

    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const ratings = (product.reviews || []).map((r) => r.rating);
    const avgRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    res.status(200).json(
      new ApiResponse(200, { ...product, rating: avgRating, reviewCount: ratings.length })
    );
  });

  getProductBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product || product.deletedAt) throw new ApiError(404, "Produit non trouvé");

    await prisma.product.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    const ratings = (product.reviews || []).map((r) => r.rating);
    const avgRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    res.status(200).json(
      new ApiResponse(200, { ...product, rating: avgRating, reviewCount: ratings.length })
    );
  });

  getFeaturedProducts = asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      where: { featured: true, status: "ACTIVE", deletedAt: null },
      take: 8,
      include: { images: { orderBy: { position: "asc" } } },
      orderBy: { salesCount: "desc" },
    });
    res.status(200).json(new ApiResponse(200, products));
  });

  createProduct = asyncHandler(async (req, res) => {
    const {
      name, description, shortDescription, category, price,
      compareAtPrice, cost, stockQuantity, lowStockThreshold,
      weight, volume, bundleLength, featured,
    } = req.body;

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

    const product = await prisma.product.create({
      data: {
        name, sku, slug, description, shortDescription, category,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        cost: cost ? parseFloat(cost) : null,
        stockQuantity: parseInt(stockQuantity) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 10,
        weight: weight ? parseFloat(weight) : null,
        volume: volume ? parseFloat(volume) : null,
        bundleLength: bundleLength ? String(bundleLength) : null,
        featuredImage: featuredImageUrl,
        status: "ACTIVE", // FIX 3: always explicit
        deletedAt: null,
        featured: featured === "true" || featured === true,
        images: galleryImagesData.length > 0 ? { create: galleryImagesData } : undefined,
      },
      include: { images: true },
    });

    res.status(201).json(new ApiResponse(201, product, "Produit créé avec succès"));
  });

  updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct || existingProduct.deletedAt)
      throw new ApiError(404, "Produit non trouvé");

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
      await prisma.productImage.deleteMany({
        where: { productId: id, id: { notIn: keepIds } },
      });
    }

    if (req.files && req.files.galleryImages) {
      const existingCount = await prisma.productImage.count({ where: { productId: id } });
      const newImages = req.files.galleryImages.map((file, index) => ({
        productId: id,
        url: `/uploads/products/${file.filename}`,
        altText: `${name || existingProduct.name} - Image ${existingCount + index + 1}`,
        position: existingCount + index,
      }));
      await prisma.productImage.createMany({ data: newImages });
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { images: true },
    });

    res.status(200).json(new ApiResponse(200, product, "Produit mis à jour"));
  });

  deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new ApiError(404, "Produit non trouvé");

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json(new ApiResponse(200, null, "Produit supprimé"));
  });

  updateInventory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stockQuantity, operation = "set" } = req.body;

    let updateData;
    if (operation === "increment") updateData = { stockQuantity: { increment: stockQuantity } };
    else if (operation === "decrement") updateData = { stockQuantity: { decrement: stockQuantity } };
    else updateData = { stockQuantity };

    const product = await prisma.product.update({ where: { id }, data: updateData });

    if (product.stockQuantity === 0) {
      await prisma.product.update({ where: { id }, data: { status: "OUT_OF_STOCK" } });
    } else if (product.status === "OUT_OF_STOCK") {
      await prisma.product.update({ where: { id }, data: { status: "ACTIVE" } });
    }

    res.status(200).json(new ApiResponse(200, product, "Inventaire mis à jour"));
  });
}

module.exports = new ProductController();