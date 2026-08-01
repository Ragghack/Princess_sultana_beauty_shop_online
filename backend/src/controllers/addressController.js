const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

class AddressController {
  /**
   * @route   GET /api/v1/addresses
   * @desc    Get address
   * @access  Private
   */
  getAddress = asyncHandler(async (req, res) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: "desc" },
    });

    res.status(200).json(new ApiResponse(200, addresses));
  });

  /**
   * @route   POST /api/v1/address
   * @desc    Create address
   * @access  Private
   */
  createAddress = asyncHandler(async (req, res) => {
    const {
      fullName,
      phone,
      street,
      city,
      region,
      postalCode,
      landmark,
      isDefault,
    } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName,
        phone,
        street,
        city,
        region,
        postalCode,
        landmark,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json(new ApiResponse(201, address, "Adresse créée"));
  });

  /**
   * @route   PATCH /api/v1/address
   * @desc    Update address
   * @access  Private
   */
  updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check ownership
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingAddress) {
      throw new ApiError(404, "Adresse non trouvée");
    }

    // If setting as default, unset other defaults
    if (req.body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json(new ApiResponse(200, address, "Adresse mise à jour"));
  });

  /**
   * @route   DELETE /api/v1/address
   * @desc    Delete address
   * @access  Private
   */
  deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const address = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!address) {
      throw new ApiError(404, "Adresse non trouvée");
    }

    await prisma.address.delete({ where: { id } });

    res.status(200).json(new ApiResponse(200, null, "Adresse supprimée"));
  });
}

module.exports = new AddressController();
