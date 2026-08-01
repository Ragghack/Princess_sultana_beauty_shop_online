const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");

/**
 * Public routes
 */
router.get("/public", settingsController.getPublicSettings);

/**
 * Protected routes (Admin only)
 */
router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", settingsController.getAllSettings);
router.get("/:key", settingsController.getSetting);
router.post("/", settingsController.createSetting);
router.patch("/:key", settingsController.updateSetting);
router.patch("/batch/update", settingsController.batchUpdateSettings);
router.delete("/:key", settingsController.deleteSetting);

module.exports = router;
