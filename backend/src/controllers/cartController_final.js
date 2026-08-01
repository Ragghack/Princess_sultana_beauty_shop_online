const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { MongoClient, ObjectId } = require("mongodb");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const mongoUrl = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/hairshop";
let mongoClient;
let mongoDb;

async function getMongoDatabase() {
  if (!mongoClient) {
    const parsedUrl = new URL(mongoUrl);
    const dbName = parsedUrl.pathname.replace(/^\/+/, "") || "hairshop";
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);
  }

  return mongoDb;
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

async function buildCartResponse(database, userId, cartDoc) {
  let cart = cartDoc;

  if (!cart) {
    const now = new Date();
    const createdCart = {
      _id: new ObjectId(),
      userId: normalizeObjectId(userId),
      createdAt: now,
      updatedAt: now,
    };

    await database.collection("carts").insertOne(createdCart);
    cart = createdCart;
  }

  const items = await database
    .collection("cart_items")
    .find({ cartId: cart._id })
    .toArray();

  const enrichedItems = [];

  for (const item of items) {
    if (item.isBundle) {
      const bundle = await database
        .collection("bundles")
        .findOne({ _id: normalizeObjectId(item.bundleId) });

      const bundleItems = bundle
        ? await database
            .collection("bundle_items")
            .find({ bundleId: bundle._id })
            .toArray()
        : [];

      const serializedBundleItems = await Promise.all(
        bundleItems.map(async (bundleItem) => {
          const product = await database.collection("products").findOne({
            _id: normalizeObjectId(bundleItem.productId),
          });

          return {
            ...bundleItem,
            id: serializeId(bundleItem._id),
            product: product
              ? {
                  id: serializeId(product._id),
                  name: product.name,
                  stockQuantity: product.stockQuantity,
                  status: product.status,
                  featuredImage: product.featuredImage,
                }
              : null,
          };
        }),
      );

      enrichedItems.push({
        ...item,
        id: serializeId(item._id),
        cartId: serializeId(item.cartId),
        bundleId: serializeId(item.bundleId),
        productId: null,
        bundle: bundle
          ? {
              ...bundle,
              id: serializeId(bundle._id),
              items: serializedBundleItems,
            }
          : null,
        product: null,
      });
    } else {
      const product = await database.collection("products").findOne({
        _id: normalizeObjectId(item.productId),
      });

      enrichedItems.push({
        ...item,
        id: serializeId(item._id),
        cartId: serializeId(item.cartId),
        productId: serializeId(item.productId),
        bundleId: null,
        product: product
          ? {
              id: serializeId(product._id),
              name: product.name,
              price: product.price,
              stockQuantity: product.stockQuantity,
              status: product.status,
              featuredImage: product.featuredImage,
            }
          : null,
        bundle: null,
      });
    }
  }

  return {
    id: serializeId(cart._id),
    userId: serializeId(cart.userId),
    items: enrichedItems,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

class CartController {
  /**
   * @route   GET /api/v1/cart
   * @desc    Get user's cart
   * @access  Private
   */
  getCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const database = await getMongoDatabase();
    const cart = await buildCartResponse(database, userId, null);

    const subtotal = cart.items.reduce((sum, item) => {
      return sum + parseFloat(item.price || 0) * item.quantity;
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
  addItem = asyncHandler(async (req, res) => {
    const { productId, bundleId, quantity = 1, isBundle = false } = req.body;
    const userId = req.user.id;
    const database = await getMongoDatabase();

    if (!productId && !bundleId) {
      throw new ApiError(400, "Product ID or Bundle ID is required");
    }

    if (productId && bundleId) {
      throw new ApiError(400, "Cannot add both product and bundle at once");
    }

    let cart = await database.collection("carts").findOne({
      userId: normalizeObjectId(userId),
    });

    if (!cart) {
      const now = new Date();
      const createdCart = {
        _id: new ObjectId(),
        userId: normalizeObjectId(userId),
        createdAt: now,
        updatedAt: now,
      };
      await database.collection("carts").insertOne(createdCart);
      cart = createdCart;
    }

    if (isBundle || bundleId) {
      const targetBundleId = normalizeObjectId(bundleId);
      const bundle = await database.collection("bundles").findOne({
        _id: targetBundleId,
      });

      if (!bundle || bundle.deletedAt) {
        throw new ApiError(404, "Bundle non trouvé");
      }

      if (bundle.status !== "ACTIVE") {
        throw new ApiError(400, "Ce bundle n'est pas disponible");
      }

      const bundleItems = await database
        .collection("bundle_items")
        .find({ bundleId: bundle._id })
        .toArray();

      for (const bundleItem of bundleItems) {
        const product = await database.collection("products").findOne({
          _id: normalizeObjectId(bundleItem.productId),
        });
        const requiredQuantity = bundleItem.quantity * parseInt(quantity, 10);
        if (!product || product.status !== "ACTIVE" || product.stockQuantity < requiredQuantity) {
          throw new ApiError(
            400,
            `Stock insuffisant pour ${bundleItem.productName} dans le bundle`,
          );
        }
      }

      const existingItem = await database.collection("cart_items").findOne({
        cartId: cart._id,
        bundleId: targetBundleId,
        isBundle: true,
      });

      if (existingItem) {
        await database.collection("cart_items").updateOne(
          { _id: existingItem._id },
          {
            $set: {
              quantity: existingItem.quantity + parseInt(quantity, 10),
              price: bundle.bundlePrice,
              updatedAt: new Date(),
            },
          },
        );
      } else {
        await database.collection("cart_items").insertOne({
          _id: new ObjectId(),
          cartId: cart._id,
          bundleId: targetBundleId,
          isBundle: true,
          quantity: parseInt(quantity, 10),
          price: bundle.bundlePrice,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } else {
      const targetProductId = normalizeObjectId(productId);
      const product = await database.collection("products").findOne({
        _id: targetProductId,
      });

      if (!product || product.status !== "ACTIVE") {
        throw new ApiError(400, "Produit non disponible");
      }

      if (product.stockQuantity < parseInt(quantity, 10)) {
        throw new ApiError(400, "Stock insuffisant");
      }

      const existingItem = await database.collection("cart_items").findOne({
        cartId: cart._id,
        productId: targetProductId,
        isBundle: false,
      });

      if (existingItem) {
        await database.collection("cart_items").updateOne(
          { _id: existingItem._id },
          {
            $set: {
              quantity: existingItem.quantity + parseInt(quantity, 10),
              price: product.price,
              updatedAt: new Date(),
            },
          },
        );
      } else {
        await database.collection("cart_items").insertOne({
          _id: new ObjectId(),
          cartId: cart._id,
          productId: targetProductId,
          quantity: parseInt(quantity, 10),
          price: product.price,
          isBundle: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    const updatedCart = await buildCartResponse(database, userId, cart);
    const subtotal = updatedCart.items.reduce((sum, item) => {
      return sum + parseFloat(item.price || 0) * item.quantity;
    }, 0);

    res.status(200).json(
      new ApiResponse(200, { ...updatedCart, subtotal, itemCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0) }, "Article ajouté au panier"),
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
    const database = await getMongoDatabase();

    if (!quantity || parseInt(quantity, 10) < 1) {
      throw new ApiError(400, "Quantité invalide");
    }

    const cart = await database.collection("carts").findOne({
      userId: normalizeObjectId(userId),
    });

    if (!cart) {
      throw new ApiError(404, "Panier non trouvé");
    }

    const cartItem = await database.collection("cart_items").findOne({
      _id: normalizeObjectId(itemId),
      cartId: cart._id,
    });

    if (!cartItem) {
      throw new ApiError(404, "Article non trouvé");
    }

    if (cartItem.isBundle) {
      const bundle = await database.collection("bundles").findOne({
        _id: normalizeObjectId(cartItem.bundleId),
      });
      const bundleItems = bundle
        ? await database
            .collection("bundle_items")
            .find({ bundleId: bundle._id })
            .toArray()
        : [];

      for (const bundleItem of bundleItems) {
        const product = await database.collection("products").findOne({
          _id: normalizeObjectId(bundleItem.productId),
        });
        const requiredQuantity = bundleItem.quantity * parseInt(quantity, 10);
        if (!product || product.stockQuantity < requiredQuantity) {
          throw new ApiError(400, `Stock insuffisant pour ${bundleItem.productName}`);
        }
      }
    } else {
      const product = await database.collection("products").findOne({
        _id: normalizeObjectId(cartItem.productId),
      });
      if (!product || product.stockQuantity < parseInt(quantity, 10)) {
        throw new ApiError(400, "Stock insuffisant");
      }
    }

    await database.collection("cart_items").updateOne(
      { _id: cartItem._id },
      { $set: { quantity: parseInt(quantity, 10), updatedAt: new Date() } },
    );

    const updatedCart = await buildCartResponse(database, userId, cart);
    const subtotal = updatedCart.items.reduce((sum, item) => {
      return sum + parseFloat(item.price || 0) * item.quantity;
    }, 0);

    res.status(200).json(
      new ApiResponse(200, { ...updatedCart, subtotal, itemCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0) }, "Quantité mise à jour"),
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
    const database = await getMongoDatabase();

    const cart = await database.collection("carts").findOne({
      userId: normalizeObjectId(userId),
    });

    if (!cart) {
      throw new ApiError(404, "Panier non trouvé");
    }

    const cartItem = await database.collection("cart_items").findOne({
      _id: normalizeObjectId(itemId),
      cartId: cart._id,
    });

    if (!cartItem) {
      throw new ApiError(404, "Article non trouvé");
    }

    await database.collection("cart_items").deleteOne({ _id: cartItem._id });

    const updatedCart = await buildCartResponse(database, userId, cart);
    const subtotal = updatedCart.items.reduce((sum, item) => {
      return sum + parseFloat(item.price || 0) * item.quantity;
    }, 0);

    res.status(200).json(
      new ApiResponse(200, { ...updatedCart, subtotal, itemCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0) }, "Article retiré du panier"),
    );
  });

  /**
   * @route   DELETE /api/v1/cart/clear
   * @desc    Clear cart
   * @access  Private
   */
  clearCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const database = await getMongoDatabase();

    const cart = await database.collection("carts").findOne({
      userId: normalizeObjectId(userId),
    });

    if (cart) {
      await database.collection("cart_items").deleteMany({ cartId: cart._id });
    }

    const updatedCart = await buildCartResponse(database, userId, cart);
    const subtotal = updatedCart.items.reduce((sum, item) => {
      return sum + parseFloat(item.price || 0) * item.quantity;
    }, 0);

    res.status(200).json(
      new ApiResponse(200, { ...updatedCart, subtotal, itemCount: updatedCart.items.reduce((sum, item) => sum + item.quantity, 0) }, "Panier vidé"),
    );
  });
}

module.exports = new CartController();
