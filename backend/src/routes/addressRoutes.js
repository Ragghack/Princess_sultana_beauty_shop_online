const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const addressController = require("../controllers/addressController");

// All routes require authentication
router.use(authenticate);

// Get user addresses
router.get("/", addressController.getAddress);

// Create address
router.post("/", addressController.createAddress);

// Update address
router.patch("/:id", addressController.updateAddress);

// Delete address
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
