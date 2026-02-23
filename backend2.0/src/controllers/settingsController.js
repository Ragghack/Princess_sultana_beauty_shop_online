const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

class SettingsController {
  /**
   * @route   GET /api/v1/settings
   * @desc    Get all settings
   * @access  Public
   */
  getAllSettings = asyncHandler(async (req, res) => {
    const settings = await prisma.systemSettings.findMany();

    // Convert to key-value object for easier use
    const settingsObj = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    res.status(200).json(new ApiResponse(200, settingsObj));
  });

  /**
   * @route   GET /api/v1/settings/:key
   * @desc    Get single setting by key
   * @access  Public
   */
  getSetting = asyncHandler(async (req, res) => {
    const { key } = req.params;

    const setting = await prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new ApiError(404, "Setting non trouvé");
    }

    res.status(200).json(new ApiResponse(200, setting));
  });

  /**
   * @route   PATCH /api/v1/settings/:key
   * @desc    Update setting
   * @access  Private (Admin only)
   */
  updateSetting = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!value) {
      throw new ApiError(400, "Value is required");
    }

    // Check if setting exists
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key },
    });

    let setting;

    if (existingSetting) {
      // Update existing setting
      setting = await prisma.systemSettings.update({
        where: { key },
        data: {
          value,
          ...(description && { description }),
        },
      });
    } else {
      // Create new setting
      setting = await prisma.systemSettings.create({
        data: {
          key,
          value,
          description,
        },
      });
    }

    res.status(200).json(new ApiResponse(200, setting, "Paramètre mis à jour"));
  });

  /**
   * @route   POST /api/v1/settings
   * @desc    Create new setting
   * @access  Private (Admin only)
   */
  createSetting = asyncHandler(async (req, res) => {
    const { key, value, description } = req.body;

    if (!key || !value) {
      throw new ApiError(400, "Key and value are required");
    }

    // Check if setting already exists
    const existing = await prisma.systemSettings.findUnique({
      where: { key },
    });

    if (existing) {
      throw new ApiError(400, "Setting already exists");
    }

    const setting = await prisma.systemSettings.create({
      data: {
        key,
        value,
        description,
      },
    });

    res.status(201).json(new ApiResponse(201, setting, "Paramètre créé"));
  });

  /**
   * @route   DELETE /api/v1/settings/:key
   * @desc    Delete setting
   * @access  Private (Admin only)
   */
  deleteSetting = asyncHandler(async (req, res) => {
    const { key } = req.params;

    const setting = await prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new ApiError(404, "Setting non trouvé");
    }

    await prisma.systemSettings.delete({
      where: { key },
    });

    res.status(200).json(new ApiResponse(200, null, "Paramètre supprimé"));
  });

  /**
   * @route   PATCH /api/v1/settings/batch
   * @desc    Update multiple settings at once
   * @access  Private (Admin only)
   */
  batchUpdateSettings = asyncHandler(async (req, res) => {
    const { settings } = req.body; // Array of {key, value, description?}

    if (!settings || !Array.isArray(settings)) {
      throw new ApiError(400, "Settings array is required");
    }

    const updates = [];

    for (const setting of settings) {
      const { key, value, description } = setting;

      if (!key || !value) {
        throw new ApiError(400, `Key and value required for each setting`);
      }

      // Upsert each setting
      const result = await prisma.systemSettings.upsert({
        where: { key },
        update: {
          value,
          ...(description && { description }),
        },
        create: {
          key,
          value,
          description,
        },
      });

      updates.push(result);
    }

    res
      .status(200)
      .json(new ApiResponse(200, updates, "Paramètres mis à jour"));
  });

  /**
   * @route   GET /api/v1/settings/public
   * @desc    Get public settings (safe to expose to frontend)
   * @access  Public
   */
  getPublicSettings = asyncHandler(async (req, res) => {
    // Only expose certain safe settings
    const publicKeys = [
      "SHOP_NAME",
      "CURRENCY",
      "DELIVERY_FEE",
      "LOW_STOCK_THRESHOLD",
      "TAX_RATE",
    ];

    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: publicKeys,
        },
      },
    });

    const settingsObj = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    res.status(200).json(new ApiResponse(200, settingsObj));
  });
}

module.exports = new SettingsController();
