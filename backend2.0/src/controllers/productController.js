const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { generateSKU, generateSlug } = require("../utils/helpers");

class ProductController {
  /**
   * @route   GET /api/v1/products
   * @desc    Get all products with filters
   * @access  Public
   */
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

    // Build where clause
    const where = {
      deletedAt: null,
    };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    } else {
      where.status = "ACTIVE"; // Only show active products by default
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: {
          images: {
            orderBy: { position: "asc" },
          },
          reviews: {
            where: { isApproved: true },
            select: {
              rating: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average rating for each product
    const productsWithRating = products.map((product) => {
      const ratings = product.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      return {
        ...product,
        rating: avgRating,
        reviewCount: ratings.length,
        reviews: undefined, // Remove reviews array
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
      }),
    );
  });

  /**
   * @route   GET /api/v1/products/:id
   * @desc    Get product by ID
   * @access  Public
   */
  getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product || product.deletedAt) {
      throw new ApiError(404, "Produit non trouvé");
    }

    // Increment view count
    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Calculate average rating
    const ratings = product.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    res.status(200).json(
      new ApiResponse(200, {
        ...product,
        rating: avgRating,
        reviewCount: ratings.length,
      }),
    );
  });

  /**
   * @route   GET /api/v1/products/slug/:slug
   * @desc    Get product by slug
   * @access  Public
   */
  getProductBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product || product.deletedAt) {
      throw new ApiError(404, "Produit non trouvé");
    }

    // Increment view count
    await prisma.product.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    // Calculate average rating
    const ratings = product.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    res.status(200).json(
      new ApiResponse(200, {
        ...product,
        rating: avgRating,
        reviewCount: ratings.length,
      }),
    );
  });

  /**
   * @route   GET /api/v1/products/featured
   * @desc    Get featured products
   * @access  Public
   */
  getFeaturedProducts = asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      where: {
        featured: true,
        status: "ACTIVE",
        deletedAt: null,
      },
      take: 8,
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { salesCount: "desc" },
    });

    res.status(200).json(new ApiResponse(200, products));
  });

  /**
   * @route   POST /api/v1/products
   * @desc    Create new product
   * @access  Private (Admin/Staff)
   */
  createProduct = asyncHandler(async (req, res) => {
    const {
      name,
      description,
      shortDescription,
      category,
      price,
      compareAtPrice,
      cost,
      stockQuantity,
      lowStockThreshold,
      weight,
      volume,
      bundleLength,
      featuredImage,
      images,
      featured,
    } = req.body;

    // Generate SKU and slug
    const sku = generateSKU(name, category);
    const slug = generateSlug(name);

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        slug,
        description,
        shortDescription,
        category,
        price,
        compareAtPrice,
        cost,
        stockQuantity,
        lowStockThreshold: lowStockThreshold || 10,
        weight,
        volume,
        bundleLength,
        featuredImage,
        featured: featured || false,
        images: images
          ? {
              create: images.map((img, index) => ({
                url: img.url,
                altText: img.altText,
                position: index,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
      },
    });

    res
      .status(201)
      .json(new ApiResponse(201, product, "Produit créé avec succès"));
  });

  /**
   * @route   PATCH /api/v1/products/:id
   * @desc    Update product
   * @access  Private (Admin/Staff)
   */
  updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct || existingProduct.deletedAt) {
      throw new ApiError(404, "Produit non trouvé");
    }

    // Update slug if name changed
    if (updateData.name && updateData.name !== existingProduct.name) {
      updateData.slug = generateSlug(updateData.name);
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        images: true,
      },
    });

    res.status(200).json(new ApiResponse(200, product, "Produit mis à jour"));
  });

  /**
   * @route   DELETE /api/v1/products/:id
   * @desc    Soft delete product
   * @access  Private (Admin)
   */
  deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json(new ApiResponse(200, null, "Produit supprimé"));
  });

  /**
   * @route   PATCH /api/v1/products/:id/inventory
   * @desc    Update product inventory
   * @access  Private (Admin/Staff)
   */
  updateInventory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stockQuantity, operation = "set" } = req.body;

    let updateData;

    if (operation === "increment") {
      updateData = { stockQuantity: { increment: stockQuantity } };
    } else if (operation === "decrement") {
      updateData = { stockQuantity: { decrement: stockQuantity } };
    } else {
      updateData = { stockQuantity };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // Update status based on stock
    if (product.stockQuantity === 0) {
      await prisma.product.update({
        where: { id },
        data: { status: "OUT_OF_STOCK" },
      });
    } else if (product.status === "OUT_OF_STOCK") {
      await prisma.product.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
    }

    res
      .status(200)
      .json(new ApiResponse(200, product, "Inventaire mis à jour"));
  });
}

module.exports = new ProductController();
