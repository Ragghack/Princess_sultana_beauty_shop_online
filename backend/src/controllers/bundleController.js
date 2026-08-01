const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { generateSlug } = require("../utils/helpers");

class BundleController {
  getBundles = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = "createdAt",
      order = "desc",
      featured,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { deletedAt: null };

    // FIX 1: "ALL" is not a valid BundleStatus enum — never pass it to Prisma
    if (status && status !== "ALL") {
      where.status = status;
    } else if (!status) {
      where.status = "ACTIVE";
    }
    // status === "ALL" → no filter → admin sees everything

    if (featured === "true") where.featured = true;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [bundles, total] = await Promise.all([
      prisma.bundle.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  featuredImage: true,
                  images: {
                    select: { url: true, altText: true },
                    take: 1,
                  },
                  stockQuantity: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      prisma.bundle.count({ where }),
    ]);

    // Diagnostic log — remove once bundles are confirmed visible
    console.log("📦 Bundles where:", JSON.stringify(where));
    console.log("📦 total:", total, "| returned:", bundles.length);

    res.status(200).json(
      new ApiResponse(200, {
        bundles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      })
    );
  });

  getBundleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bundle = await prisma.bundle.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { orderBy: { position: "asc" } } },
            },
          },
        },
      },
    });

    if (!bundle || bundle.deletedAt) throw new ApiError(404, "Bundle non trouvé");

    await prisma.bundle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const hasStockIssues = bundle.items.some(
      (item) => item.product.stockQuantity < item.quantity
    );

    res.status(200).json(new ApiResponse(200, { ...bundle, hasStockIssues }));
  });

  getBundleBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const bundle = await prisma.bundle.findUnique({
      where: { slug },
      include: {
        items: {
          include: {
            product: {
              include: { images: { orderBy: { position: "asc" } } },
            },
          },
        },
      },
    });

    if (!bundle || bundle.deletedAt) throw new ApiError(404, "Bundle non trouvé");

    await prisma.bundle.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    const hasStockIssues = bundle.items.some(
      (item) => item.product.stockQuantity < item.quantity
    );

    res.status(200).json(new ApiResponse(200, { ...bundle, hasStockIssues }));
  });

  createBundle = asyncHandler(async (req, res) => {
    const {
      name, description, shortDescription,
      bundlePrice, items, featured,
    } = req.body;

    if (!name || !bundlePrice || !items || items.length === 0) {
      throw new ApiError(400, "Nom, prix et produits sont obligatoires");
    }

    let originalPrice = 0;
    const bundleItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });

      if (!product || product.deletedAt)
        throw new ApiError(404, `Produit ${item.productId} non trouvé`);
      if (product.status !== "ACTIVE")
        throw new ApiError(400, `Le produit ${product.name} n'est pas actif`);

      const itemQuantity = parseInt(item.quantity) || 1;
      originalPrice += parseFloat(product.price) * itemQuantity;

      bundleItems.push({
        productId: product.id,
        quantity: itemQuantity,
        productName: product.name,
        productPrice: product.price,
        productImage: product.featuredImage,
      });
    }

    const bundlePriceDecimal = parseFloat(bundlePrice);
    const savingsAmount = originalPrice - bundlePriceDecimal;
    const savingsPercent = (savingsAmount / originalPrice) * 100;

    if (bundlePriceDecimal >= originalPrice) {
      throw new ApiError(
        400,
        `Le prix du bundle (${bundlePriceDecimal}) doit être inférieur au prix total (${originalPrice})`
      );
    }

    const slug = generateSlug(name);
    const existingBundle = await prisma.bundle.findUnique({ where: { slug } });
    if (existingBundle) throw new ApiError(400, "Un bundle avec ce nom existe déjà");

    const bundle = await prisma.bundle.create({
      data: {
        name, slug, description, shortDescription,
        bundlePrice: bundlePriceDecimal,
        originalPrice, savingsAmount, savingsPercent,
        featured: featured || false,
        status: "ACTIVE",
        deletedAt: null, // FIX 2: explicit null so MongoDB stores the field — prevents the invisible bundle bug
        items: { create: bundleItems },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    res.status(201).json(new ApiResponse(201, bundle, "Bundle créé avec succès"));
  });

  updateBundle = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, shortDescription, bundlePrice, items, featured, status } = req.body;

    const existingBundle = await prisma.bundle.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingBundle || existingBundle.deletedAt)
      throw new ApiError(404, "Bundle non trouvé");

    let updateData = { description, shortDescription, featured, status };

    if (name && name !== existingBundle.name) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }

    if (items && items.length > 0) {
      let originalPrice = 0;
      const bundleItems = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });

        if (!product || product.deletedAt)
          throw new ApiError(404, `Produit ${item.productId} non trouvé`);

        const itemQuantity = parseInt(item.quantity) || 1;
        originalPrice += parseFloat(product.price) * itemQuantity;

        bundleItems.push({
          productId: product.id,
          quantity: itemQuantity,
          productName: product.name,
          productPrice: product.price,
          productImage: product.featuredImage,
        });
      }

      const newBundlePrice = bundlePrice
        ? parseFloat(bundlePrice)
        : parseFloat(existingBundle.bundlePrice);

      if (newBundlePrice >= originalPrice) {
        throw new ApiError(
          400,
          `Le prix du bundle (${newBundlePrice}) doit être inférieur au prix total (${originalPrice})`
        );
      }

      const savingsAmount = originalPrice - newBundlePrice;
      const savingsPercent = (savingsAmount / originalPrice) * 100;

      updateData = {
        ...updateData,
        bundlePrice: newBundlePrice,
        originalPrice,
        savingsAmount,
        savingsPercent,
      };

      await prisma.bundleItem.deleteMany({ where: { bundleId: id } });
      updateData.items = { create: bundleItems };

    } else if (bundlePrice) {
      const newBundlePrice = parseFloat(bundlePrice);

      if (newBundlePrice >= parseFloat(existingBundle.originalPrice)) {
        throw new ApiError(
          400,
          `Le prix du bundle doit être inférieur au prix total (${existingBundle.originalPrice})`
        );
      }

      const savingsAmount = parseFloat(existingBundle.originalPrice) - newBundlePrice;
      const savingsPercent = (savingsAmount / parseFloat(existingBundle.originalPrice)) * 100;

      updateData.bundlePrice = newBundlePrice;
      updateData.savingsAmount = savingsAmount;
      updateData.savingsPercent = savingsPercent;
    }

    const bundle = await prisma.bundle.update({
      where: { id },
      data: updateData,
      include: { items: { include: { product: true } } },
    });

    res.status(200).json(new ApiResponse(200, bundle, "Bundle mis à jour"));
  });

  deleteBundle = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bundle = await prisma.bundle.findUnique({ where: { id } });
    if (!bundle) throw new ApiError(404, "Bundle non trouvé");

    await prisma.bundle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json(new ApiResponse(200, null, "Bundle supprimé"));
  });

  checkBundleStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity = 1 } = req.query;

    const bundle = await prisma.bundle.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, stockQuantity: true, status: true },
            },
          },
        },
      },
    });

    if (!bundle) throw new ApiError(404, "Bundle non trouvé");

    const stockIssues = [];
    let hasStock = true;

    for (const item of bundle.items) {
      const requiredQuantity = item.quantity * parseInt(quantity);
      if (item.product.stockQuantity < requiredQuantity || item.product.status !== "ACTIVE") {
        hasStock = false;
        stockIssues.push({
          productId: item.product.id,
          productName: item.product.name,
          required: requiredQuantity,
          available: item.product.stockQuantity,
          status: item.product.status,
        });
      }
    }

    res.status(200).json(
      new ApiResponse(200, { bundleId: bundle.id, bundleName: bundle.name, hasStock, stockIssues })
    );
  });
}

module.exports = new BundleController();