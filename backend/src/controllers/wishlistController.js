const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

class WishlistController {
  /**
   * @route   GET /api/v1/wishlist
   * @desc    Get user's wishlist
   * @access  Private
   */
  getWishlist = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: {
              take: 1,
            },
          },
        },
        bundle: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    featuredImage: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(
      new ApiResponse(200, {
        items: wishlistItems,
        count: wishlistItems.length,
      })
    );
  });

  /**
   * @route   POST /api/v1/wishlist/items
   * @desc    Add item to wishlist (product or bundle)
   * @access  Private
   */
  addToWishlist = asyncHandler(async (req, res) => {
    const { productId, bundleId, isBundle = false } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId && !bundleId) {
      throw new ApiError(400, "Product ID or Bundle ID is required");
    }

    if (productId && bundleId) {
      throw new ApiError(400, "Cannot add both product and bundle at once");
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findFirst({
      where: {
        userId,
        ...(isBundle || bundleId
          ? { bundleId: bundleId }
          : { productId: productId }),
      },
    });

    if (existing) {
      throw new ApiError(400, "Article déjà dans la liste de souhaits");
    }

    // Validate product or bundle exists
    if (isBundle || bundleId) {
      const bundle = await prisma.bundle.findUnique({
        where: { id: bundleId },
      });

      if (!bundle || bundle.deletedAt) {
        throw new ApiError(404, "Bundle non trouvé");
      }
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.deletedAt) {
        throw new ApiError(404, "Produit non trouvé");
      }
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId,
        productId: isBundle ? null : productId,
        bundleId: isBundle ? bundleId : null,
        isBundle,
      },
      include: {
        product: true,
        bundle: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          wishlistItem,
          "Article ajouté à la liste de souhaits"
        )
      );
  });

  /**
   * @route   DELETE /api/v1/wishlist/items/:id
   * @desc    Remove item from wishlist
   * @access  Private
   */
  removeFromWishlist = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id },
    });

    if (!wishlistItem) {
      throw new ApiError(404, "Article non trouvé");
    }

    // Check ownership
    if (wishlistItem.userId !== userId) {
      throw new ApiError(403, "Accès non autorisé");
    }

    await prisma.wishlistItem.delete({
      where: { id },
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, null, "Article retiré de la liste de souhaits")
      );
  });

  /**
   * @route   DELETE /api/v1/wishlist/clear
   * @desc    Clear entire wishlist
   * @access  Private
   */
  clearWishlist = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await prisma.wishlistItem.deleteMany({
      where: { userId },
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Liste de souhaits vidée"));
  });

  /**
   * @route   POST /api/v1/wishlist/move-to-cart/:id
   * @desc    Move item from wishlist to cart
   * @access  Private
   */
  moveToCart = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity = 1 } = req.body;
    const userId = req.user.id;

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id },
      include: {
        product: true,
        bundle: true,
      },
    });

    if (!wishlistItem) {
      throw new ApiError(404, "Article non trouvé");
    }

    if (wishlistItem.userId !== userId) {
      throw new ApiError(403, "Accès non autorisé");
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Add to cart
    if (wishlistItem.isBundle) {
      // Add bundle to cart
      const existingCartItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          bundleId: wishlistItem.bundleId,
        },
      });

      if (existingCartItem) {
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            bundleId: wishlistItem.bundleId,
            isBundle: true,
            quantity,
            price: wishlistItem.bundle.bundlePrice,
          },
        });
      }
    } else {
      // Add product to cart
      const existingCartItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: wishlistItem.productId,
        },
      });

      if (existingCartItem) {
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: wishlistItem.productId,
            isBundle: false,
            quantity,
            price: wishlistItem.product.price,
          },
        });
      }
    }

    // Remove from wishlist
    await prisma.wishlistItem.delete({
      where: { id },
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, null, "Article déplacé vers le panier")
      );
  });

  /**
   * @route   GET /api/v1/wishlist/check/:productId
   * @desc    Check if product/bundle is in wishlist
   * @access  Private
   */
  checkInWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { isBundle = false } = req.query;
    const userId = req.user.id;

    const exists = await prisma.wishlistItem.findFirst({
      where: {
        userId,
        ...(isBundle === "true"
          ? { bundleId: productId }
          : { productId: productId }),
      },
    });

    res.status(200).json(
      new ApiResponse(200, {
        inWishlist: !!exists,
        wishlistItemId: exists?.id || null,
      })
    );
  });
}

module.exports = new WishlistController();
