const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const auth = require("../middleware/auth");

// ============================
// 🛒 ORDER ROUTES
// ============================

// ✅ Create a new order
router.post("/", auth, async (req, res) => {
  try {
    const { items, amount, shippingAddress, paymentMethod } = req.body;
    const user = req.user.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Items are required" 
      });
    }

    const newOrder = new Order({
      user,
      items: items.map(item => ({
        product: item.id,
        qty: item.qty,
        price: item.price
      })),
      amount,
      shippingAddress: shippingAddress || {},
      paymentMethod: paymentMethod || "whatsapp",
      status: "pending"
    });

    await newOrder.save();
    
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("items.product", "name imageURL");

    res.status(201).json({ 
      success: true, 
      message: "Order created successfully", 
      order: populatedOrder 
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ✅ WhatsApp Order Endpoint (FIXED)
router.post("/whatsapp", auth, async (req, res) => {
  try {
    const { items, amount, shippingAddress, notes } = req.body;
    const userId = req.user.userId;

    // ✅ FIXED: Added proper validation inside the route
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Cart is empty" 
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Valid amount is required" 
      });
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone) {
      return res.status(400).json({ 
        success: false,
        message: "Shipping address with name and phone is required" 
      });
    }

    // Create order in database
    const newOrder = new Order({
      user: userId,
      // ✅ FIXED: Removed the undefined 'user' reference
      items: items.map(item => ({
        product: item.id,
        qty: item.qty,
        price: item.price
      })),
      amount: parseFloat(amount),
      shippingAddress: shippingAddress || {},
      paymentMethod: 'whatsapp',
      status: 'pending'
    });

    await newOrder.save();

    // Generate WhatsApp message
    let message = 'Hello Sultana shop, %0A%0A';
    message += 'I would like to place an order:%0A%0A';
    
    items.forEach(item => {
      message += `- ${item.name} (x${item.qty}) - ${(item.price * item.qty).toLocaleString()} XAF%0A`;
    });
    
    message += `%0ATotal: ${parseFloat(amount).toLocaleString()} XAF%0A%0A`;
    
    if (shippingAddress && shippingAddress.name) {
      message += `Shipping to: ${shippingAddress.name}%0A`;
      if (shippingAddress.phone) message += `Phone: ${shippingAddress.phone}%0A`;
      if (shippingAddress.address) message += `Address: ${shippingAddress.address}%0A`;
    }
    
    if (notes) {
      message += `Notes: ${notes}%0A`;
    }
    
    message += '%0AThank you!';
    
    const whatsappUrl = `https://wa.me/237679225169?text=${message}`;

    res.json({ 
      success: true, 
      message: "Order saved successfully",
      order: newOrder,
      whatsappUrl: whatsappUrl
    });

  } catch (error) {
    console.error('WhatsApp order error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ✅ Get current user's orders
router.get("/my-orders", auth, async (req, res) => {
  try {
    const userOrders = await Order.find({ user: req.user.userId })
      .populate("items.product", "name imageURL price")
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      orders: userOrders 
    });
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ✅ Get a single order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name imageURL price")
      .populate("user", "name email");
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    res.json({ 
      success: true, 
      order 
    });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ✅ Cancel an order
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        message: "Access denied" 
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ 
        success: false,
        message: "Only pending orders can be cancelled" 
      });
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    await order.save();

    res.json({ 
      success: true, 
      message: "Order cancelled successfully",
      order 
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ✅ Get all orders (Admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Admin access required" 
      });
    }

    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name imageURL")
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      orders
    });
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// ✅ Update order status (Admin only)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Admin access required" 
      });
    }

    const { status, trackingNumber } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product", "name");

    res.json({ 
      success: true, 
      message: "Order status updated successfully",
      order: populatedOrder 
    });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;