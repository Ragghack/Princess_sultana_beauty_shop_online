const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authenticate = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.patch("/items/:itemId", cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);
router.delete("/clear", cartController.clearCart);

module.exports = router;
