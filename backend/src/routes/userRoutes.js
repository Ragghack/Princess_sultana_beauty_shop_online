const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");

/**
 * All user routes require authentication
 */
router.use(authenticate);

/**
 * Current user profile routes
 */
router.get("/profile", userController.getProfile);
router.patch("/profile", userController.updateProfile);
router.patch("/password", userController.changePassword);

/**
 * Current user addresses
 */
router.get("/me/addresses", userController.getMyAddresses);
router.post("/me/addresses", userController.addAddress);
router.patch("/me/addresses/:id", userController.updateAddress);
router.delete("/me/addresses/:id", userController.deleteAddress);

/**
 * Admin only routes
 */
router.get("/", authorize("ADMIN"), userController.getAllUsers);
router.get("/customers", authorize("ADMIN"), userController.getAllCustomers);
router.get("/:id", authorize("ADMIN"), userController.getUserById);
router.patch("/:id", authorize("ADMIN"), userController.updateUser);
router.delete("/:id", authorize("ADMIN"), userController.deleteUser);

module.exports = router;
