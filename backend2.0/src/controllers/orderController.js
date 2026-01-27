const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const {
  generateOrderNumber,
  calculateDiscount,
  isDiscountCodeValid,
} = require("../utils/helpers");
const { DELIVERY_FEE } = require("../config/constants");

class OrderController {
  /**
   * @route   POST /api/v1/orders
   * @desc    Create new order
   * @access  Private
   */
  createOrder = asyncHandler(async (req, res) => {
    const { addressId, paymentMethod, items, discountCode, customerNotes } =
      req.body;
    const userId = req.user.id;

    // Validate address belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new ApiError(400, "Adresse invalide");
    }

    // Validate items and calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || product.status !== "ACTIVE") {
        throw new ApiError(400, `Produit ${item.productId} non disponible`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new ApiError(400, `Stock insuffisant pour ${product.name}`);
      }

      const itemTotal = parseFloat(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productImage: product.featuredImage,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemTotal,
      });
    }

    // Validate and apply discount code
    let discount = 0;
    let discountCodeId = null;

    if (discountCode) {
      const code = await prisma.discountCode.findUnique({
        where: { code: discountCode },
      });

      if (!code) {
        throw new ApiError(400, "Code promo invalide");
      }

      if (!isDiscountCodeValid(code)) {
        throw new ApiError(400, "Code promo expiré ou limite atteinte");
      }

      if (
        code.minPurchaseAmount &&
        subtotal < parseFloat(code.minPurchaseAmount)
      ) {
        throw new ApiError(
          400,
          `Montant minimum de ${code.minPurchaseAmount} XAF requis`,
        );
      }

      discount = calculateDiscount(subtotal, code);
      discountCodeId = code.id;
    }

    const total = subtotal + DELIVERY_FEE - discount;

    // Create order
    const order = await prisma.$transaction(async (tx) => {
      // Generate order number
      const orderNumber = generateOrderNumber();

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          paymentMethod,
          subtotal,
          discount,
          deliveryFee: DELIVERY_FEE,
          total,
          customerNotes,
          discountCodeId,
          status: "PENDING",
          paymentStatus: "PENDING",
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          address: true,
          user: true,
        },
      });

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });
      }

      // Update discount code usage
      if (discountCodeId) {
        await tx.discountCode.update({
          where: { id: discountCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear user's cart
      await tx.cartItem.deleteMany({
        where: {
          cart: {
            userId,
          },
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: "PENDING",
          notes: "Commande créée",
          changedBy: userId,
        },
      });

      return newOrder;
    });

    // TODO: Send notifications (email & WhatsApp)
    // await notificationService.sendOrderConfirmation(order);

    res
      .status(201)
      .json(new ApiResponse(201, order, "Commande créée avec succès"));
  });

  /**
   * @route   GET /api/v1/orders
   * @desc    Get orders (filtered by role)
   * @access  Private
   */
  getOrders = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause based on role
    let where = {};

    if (userRole === "CUSTOMER") {
      where.userId = userId;
    } else if (userRole === "DELIVERY") {
      where.deliveryPersonnelId = userId;
    }
    // Admin and Staff can see all orders

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          items: {
            include: {
              product: true,
            },
          },
          address: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          deliveryPersonnel: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json(
      new ApiResponse(200, {
        orders,
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
   * @route   GET /api/v1/orders/:id
   * @desc    Get order by ID
   * @access  Private
   */
  getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        deliveryPersonnel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        discountCode: true,
      },
    });

    if (!order) {
      throw new ApiError(404, "Commande non trouvée");
    }

    // Check authorization
    if (
      (userRole === "CUSTOMER" && order.userId !== userId) ||
      (userRole === "DELIVERY" && order.deliveryPersonnelId !== userId)
    ) {
      throw new ApiError(403, "Accès refusé");
    }

    res.status(200).json(new ApiResponse(200, order));
  });

  /**
   * @route   PATCH /api/v1/orders/:id/status
   * @desc    Update order status
   * @access  Private (Admin/Staff)
   */
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    const order = await prisma.$transaction(async (tx) => {
      // Update order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status,
          ...(status === "CONFIRMED" && { confirmedAt: new Date() }),
          ...(status === "DELIVERED" && { deliveredAt: new Date() }),
          ...(status === "CANCELLED" && { cancelledAt: new Date() }),
        },
        include: {
          items: true,
          user: true,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
          notes,
          changedBy: userId,
        },
      });

      // If cancelled, restore stock
      if (status === "CANCELLED") {
        for (const item of updatedOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
              salesCount: { decrement: item.quantity },
            },
          });
        }
      }

      return updatedOrder;
    });

    // TODO: Send notification
    // await notificationService.sendOrderStatusUpdate(order);

    res.status(200).json(new ApiResponse(200, order, "Statut mis à jour"));
  });

  /**
   * @route   PATCH /api/v1/orders/:id/assign-delivery
   * @desc    Assign order to delivery personnel
   * @access  Private (Admin/Staff)
   */
  assignDelivery = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { deliveryPersonnelId } = req.body;

    // Validate delivery personnel
    const deliveryPerson = await prisma.user.findUnique({
      where: { id: deliveryPersonnelId },
    });

    if (!deliveryPerson || deliveryPerson.role !== "DELIVERY") {
      throw new ApiError(400, "Personnel de livraison invalide");
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        deliveryPersonnelId,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
      include: {
        deliveryPersonnel: true,
        user: true,
        address: true,
      },
    });

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: "ASSIGNED",
        notes: `Assigné à ${deliveryPerson.firstName} ${deliveryPerson.lastName}`,
        changedBy: req.user.id,
      },
    });

    // TODO: Send notification to delivery personnel
    // await notificationService.sendDeliveryAssignment(order);

    res.status(200).json(new ApiResponse(200, order, "Livreur assigné"));
  });

  /**
   * @route   PATCH /api/v1/orders/:id/mark-delivered
   * @desc    Mark order as delivered (Delivery personnel)
   * @access  Private (Delivery)
   */
  markAsDelivered = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if order is assigned to this delivery person
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new ApiError(404, "Commande non trouvée");
    }

    if (order.deliveryPersonnelId !== userId) {
      throw new ApiError(403, "Commande non assignée à vous");
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          ...(order.paymentMethod === "CASH_ON_DELIVERY" && {
            paymentStatus: "COMPLETED",
            paidAt: new Date(),
          }),
        },
        include: {
          user: true,
          items: true,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: "DELIVERED",
          notes: "Commande livrée",
          changedBy: userId,
        },
      });

      return updated;
    });

    // TODO: Send notification
    // await notificationService.sendDeliveryConfirmation(updatedOrder);

    res
      .status(200)
      .json(
        new ApiResponse(200, updatedOrder, "Commande marquée comme livrée"),
      );
  });

  /**
   * @route   PATCH /api/v1/orders/:id/cancel
   * @desc    Cancel order
   * @access  Private (Customer/Admin)
   */
  cancelOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new ApiError(404, "Commande non trouvée");
    }

    // Check authorization
    if (userRole === "CUSTOMER" && order.userId !== userId) {
      throw new ApiError(403, "Accès refusé");
    }

    // Check if order can be cancelled
    if (["DELIVERED", "CANCELLED"].includes(order.status)) {
      throw new ApiError(400, "Cette commande ne peut pas être annulée");
    }

    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Update order
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          adminNotes: reason,
        },
      });

      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            salesCount: { decrement: item.quantity },
          },
        });
      }

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: "CANCELLED",
          notes: reason || "Commande annulée",
          changedBy: userId,
        },
      });

      return updated;
    });

    // TODO: Send notification and process refund if paid
    // await notificationService.sendOrderCancellation(cancelledOrder);

    res
      .status(200)
      .json(new ApiResponse(200, cancelledOrder, "Commande annulée"));
  });
}

module.exports = new OrderController();
