const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { isDiscountCodeValid } = require("../utils/helpers");

class DiscountController {
  /**
   * @route   GET /api/v1/discounts
   * @desc    Get all discount codes
   * @access  Private (Admin/Staff)
   */
  getDiscountCodes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [codes, total] = await Promise.all([
      prisma.discountCode.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.discountCode.count({ where }),
    ]);

    res.status(200).json(
      new ApiResponse(200, {
        codes,
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
   * @route   POST /api/v1/discounts/validate
   * @desc    Validate discount code
   * @access  Private (Customer)
   */
  validateDiscountCode = asyncHandler(async (req, res) => {
    const { code } = req.body;

    const discountCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discountCode) {
      throw new ApiError(404, "Code promo invalide");
    }

    if (!isDiscountCodeValid(discountCode)) {
      throw new ApiError(400, "Code promo expiré ou limite atteinte");
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          code: discountCode.code,
          type: discountCode.type,
          value: discountCode.value,
          minPurchaseAmount: discountCode.minPurchaseAmount,
        },
        "Code promo valide",
      ),
    );
  });

  /**
   * @route   POST /api/v1/discounts
   * @desc    Create discount code
   * @access  Private (Admin)
   */
  createDiscountCode = asyncHandler(async (req, res) => {
    const {
      code,
      description,
      type,
      value,
      maxUses,
      maxUsesPerUser,
      minPurchaseAmount,
      startDate,
      endDate,
    } = req.body;

    // Check if code already exists
    const existingCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      throw new ApiError(400, "Ce code promo existe déjà");
    }

    const discountCode = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        description,
        type,
        value,
        maxUses,
        maxUsesPerUser,
        minPurchaseAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.status(201).json(new ApiResponse(201, discountCode, "Code promo créé"));
  });

  /**
   * @route   PATCH /api/v1/discounts/:id
   * @desc    Update discount code
   * @access  Private (Admin)
   */
  updateDiscountCode = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const discountCode = await prisma.discountCode.update({
      where: { id },
      data: updateData,
    });

    res
      .status(200)
      .json(new ApiResponse(200, discountCode, "Code promo mis à jour"));
  });

  /**
   * @route   DELETE /api/v1/discounts/:id
   * @desc    Delete discount code
   * @access  Private (Admin)
   */
  deleteDiscountCode = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.discountCode.delete({
      where: { id },
    });

    res.status(200).json(new ApiResponse(200, null, "Code promo supprimé"));
  });

  /**
   * @route   PATCH /api/v1/discounts/:id/toggle-status
   * @desc    Toggle discount code active status
   * @access  Private (Admin)
   */
  toggleStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const discountCode = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!discountCode) {
      throw new ApiError(404, "Code promo non trouvé");
    }

    const updated = await prisma.discountCode.update({
      where: { id },
      data: { isActive: !discountCode.isActive },
    });

    res.status(200).json(new ApiResponse(200, updated, "Statut mis à jour"));
  });
}

module.exports = new DiscountController();
