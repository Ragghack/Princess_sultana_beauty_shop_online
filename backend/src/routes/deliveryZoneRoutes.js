const express = require("express");
const router = express.Router();
const deliveryZoneController = require("../controllers/deliveryZoneController");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");

// Public route - customers searching for their town/quarter at checkout
router.get("/", deliveryZoneController.getActiveZones);

// Admin routes
router.get(
  "/admin",
  authenticate,
  authorize("ADMIN", "STAFF"),
  deliveryZoneController.getAllZones,
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  deliveryZoneController.createZone,
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deliveryZoneController.updateZone,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deliveryZoneController.deleteZone,
);

module.exports = router;