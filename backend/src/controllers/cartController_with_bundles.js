const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

class CartController {
  /**
   * @route   GET /api/v1/cart
   * @desc    Get user's cart
   * @access  Private
   */
  getCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                featuredImage: true,
                stockQuantity: true,
                status: true,
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
                        stockQuantity: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Create cart if doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);

    res.status(200).json(
      new ApiResponse(200, {
        ...cart,
        subtotal,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      }),
    );
  });

  /**
   * @route   POST /api/v1/cart/items
   * @desc    Add item to cart (product or bundle)
   * @access  Private
   */
  addToCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { productId, bundleId, quantity = 1, isBundle = false } = req.body;

    // Validate input
    if (!productId && !bundleId) {
      throw new ApiError(400, "Product ID or Bundle ID is required");
    }

    if (productId && bundleId) {
      throw new ApiError(400, "Cannot add both product and bundle at once");
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

    let price;
    let itemData;

    if (isBundle || bundleId) {
      // Adding a bundle
      const bundle = await prisma.bundle.findUnique({
        where: { id: bundleId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  stockQuantity: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!bundle || bundle.deletedAt) {
        throw new ApiError(404, "Bundle non trouvé");
      }

      if (bundle.status !== "ACTIVE") {
        throw new ApiError(400, "Ce bundle n'est pas disponible");
      }

      // Check stock for all products in bundle
      for (const item of bundle.items) {
        const requiredQuantity = item.quantity * quantity;
        if (
          item.product.stockQuantity < requiredQuantity ||
          item.product.status !== "ACTIVE"
        ) {
          throw new ApiError(
            400,
            `Stock insuffisant pour ${item.productName} dans le bundle`,
          );
        }
      }

      price = bundle.bundlePrice;
      itemData = {
        cartId: cart.id,
        bundleId: bundle.id,
        isBundle: true,
        quantity: parseInt(quantity),
        price,
      };
    } else {
      // Adding a product
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.deletedAt) {
        throw new ApiError(404, "Produit non trouvé");
      }

      if (product.status !== "ACTIVE") {
        throw new ApiError(400, "Ce produit n'est pas disponible");
      }

      if (product.stockQuantity < quantity) {
        throw new ApiError(400, "Stock insuffisant");
      }

      price = product.price;
      itemData = {
        cartId: cart.id,
        productId: product.id,
        isBundle: false,
        quantity: parseInt(quantity),
        price,
      };
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        ...(isBundle || bundleId ? { bundleId } : { productId }),
      },
    });

    let cartItem;

    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + parseInt(quantity),
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: itemData,
      });
    }

    // Get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
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
        },
      },
    });

    res.status(200).json(
      new ApiResponse(200, updatedCart, "Article ajouté au panier"),
    );
  });

  /**
   * @route   PATCH /api/v1/cart/items/:id
   * @desc    Update cart item quantity
   * @access  Private
   */
  updateCartItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (!quantity || quantity < 1) {
      throw new ApiError(400, "Quantité invalide");
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
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

    if (!cartItem) {
      throw new ApiError(404, "Article non trouvé");
    }

    // Check if cart belongs to user
    if (cartItem.cart.userId !== userId) {
      throw new ApiError(403, "Accès non autorisé");
    }

    // Check stock
    if (cartItem.isBundle) {
      // Check stock for all products in bundle
      for (const item of cartItem.bundle.items) {
        const requiredQuantity = item.quantity * quantity;
        if (item.product.stockQuantity < requiredQuantity) {
          throw new ApiError(
            400,
            `Stock insuffisant pour ${item.productName}`,
          );
        }
      }
    } else {
      if (cartItem.product.stockQuantity < quantity) {
        throw new ApiError(400, "Stock insuffisant");
      }
    }

    // Update quantity
    await prisma.cartItem.update({
      where: { id },
      data: { quantity: parseInt(quantity) },
    });

    // Get updated cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
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
        },
      },
    });

    res.status(200).json(new ApiResponse(200, cart, "Panier mis à jour"));
  });

  /**
   * @route   DELETE /api/v1/cart/items/:id
   * @desc    Remove item from cart
   * @access  Private
   */
  removeFromCart = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new ApiError(404, "Article non trouvé");
    }

    // Check if cart belongs to user
    if (cartItem.cart.userId !== userId) {
      throw new ApiError(403, "Accès non autorisé");
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    // Get updated cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
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
        },
      },
    });

    res.status(200).json(new ApiResponse(200, cart, "Article retiré du panier"));
  });

  /**
   * @route   DELETE /api/v1/cart
   * @desc    Clear entire cart
   * @access  Private
   */
  clearCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId,
        },
      },
    });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    res.status(200).json(new ApiResponse(200, cart, "Panier vidé"));
  });
}

module.exports = new CartController();
