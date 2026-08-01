const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

class DeliveryZoneController {
  /**
   * @route   GET /api/v1/delivery-zones
   * @desc    List all active delivery zones (for the customer search/combobox)
   * @access  Public
   */
  getActiveZones = asyncHandler(async (req, res) => {
    const zones = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: [{ region: "asc" }, { town: "asc" }, { quarter: "asc" }],
    });

    res.status(200).json(new ApiResponse(200, zones));
  });

  /**
   * @route   GET /api/v1/delivery-zones/admin
   * @desc    List all delivery zones, including inactive ones
   * @access  Private (Admin/Staff)
   */
  getAllZones = asyncHandler(async (req, res) => {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          OR: [
            { region: { contains: search, mode: "insensitive" } },
            { town: { contains: search, mode: "insensitive" } },
            { quarter: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [zones, total] = await Promise.all([
      prisma.deliveryZone.findMany({
        where,
        orderBy: [{ region: "asc" }, { town: "asc" }, { quarter: "asc" }],
        skip,
        take: Number(limit),
      }),
      prisma.deliveryZone.count({ where }),
    ]);

    res.status(200).json(
      new ApiResponse(200, {
        zones,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      }),
    );
  });

  /**
   * @route   POST /api/v1/delivery-zones
   * @desc    Create a delivery zone
   * @access  Private (Admin)
   */
  createZone = asyncHandler(async (req, res) => {
    const { region, town, quarter, fee, isActive } = req.body;

    if (!region || !town || fee === undefined || fee === null) {
      throw new ApiError(400, "Région, ville et frais sont requis");
    }

    if (Number(fee) < 0) {
      throw new ApiError(400, "Le frais de livraison ne peut pas être négatif");
    }

    const existing = await prisma.deliveryZone.findUnique({
      where: {
        town_quarter: {
          town,
          quarter: quarter || null,
        },
      },
    });

    if (existing) {
      throw new ApiError(
        400,
        "Une zone existe déjà pour cette ville et ce quartier",
      );
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        region,
        town,
        quarter: quarter || null,
        fee: Number(fee),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res
      .status(201)
      .json(new ApiResponse(201, zone, "Zone de livraison créée"));
  });

  /**
   * @route   PATCH /api/v1/delivery-zones/:id
   * @desc    Update a delivery zone
   * @access  Private (Admin)
   */
  updateZone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { region, town, quarter, fee, isActive } = req.body;

    const zone = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) {
      throw new ApiError(404, "Zone de livraison non trouvée");
    }

    if (fee !== undefined && Number(fee) < 0) {
      throw new ApiError(400, "Le frais de livraison ne peut pas être négatif");
    }

    const updated = await prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(region !== undefined && { region }),
        ...(town !== undefined && { town }),
        ...(quarter !== undefined && { quarter: quarter || null }),
        ...(fee !== undefined && { fee: Number(fee) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, updated, "Zone de livraison mise à jour"));
  });

  /**
   * @route   DELETE /api/v1/delivery-zones/:id
   * @desc    Delete a delivery zone
   * @access  Private (Admin)
   */
  deleteZone = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const zone = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) {
      throw new ApiError(404, "Zone de livraison non trouvée");
    }

    await prisma.deliveryZone.delete({ where: { id } });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Zone de livraison supprimée"));
  });
}

module.exports = new DeliveryZoneController();