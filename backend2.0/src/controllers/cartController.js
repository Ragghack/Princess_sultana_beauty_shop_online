const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

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
              include: {
                images: {
                  take: 1,
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
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    res.status(200).json(new ApiResponse(200, cart));
  });

  /**
   * @route   POST /api/v1/cart/items
   * @desc    Add item to cart
   * @access  Private
   */
  addItem = asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Validate product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new ApiError(400, 'Produit non disponible');
    }

    if (product.stockQuantity < quantity) {
      throw new ApiError(400, 'Stock insuffisant');
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

    // Check if item already exists
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
      },
    });

    let cartItem;

    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true },
      });
    } else {
      // Add new item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity,
        },
        include: { product: true },
      });
    }

    // Get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json(
      new ApiResponse(200, updatedCart, 'Article ajouté au panier')
    );
  });

  /**
   * @route   PATCH /api/v1/cart/items/:itemId
   * @desc    Update cart item quantity
   * @access  Private
   */
  updateItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    // Validate cart item belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new ApiError(404, 'Article non trouvé');
    }

    if (cartItem.product.stockQuantity < quantity) {
      throw new ApiError(400, 'Stock insuffisant');
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    // Get updated cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json(
      new ApiResponse(200, cart, 'Quantité mise à jour')
    );
  });

  /**
   * @route   DELETE /api/v1/cart/items/:itemId
   * @desc    Remove item from cart
   * @access  Private
   */
  removeItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Validate cart item belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new ApiError(404, 'Article non trouvé');
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Get updated cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json(
      new ApiResponse(200, cart, 'Article retiré du panier')
    );
  });

  /**
   * @route   DELETE /api/v1/cart/clear
   * @desc    Clear cart
   * @access  Private
   */
  clearCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get cart first
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    res.status(200).json(
      new ApiResponse(200, updatedCart, 'Panier vidé')
    );
  });
}

module.exports = new CartController();