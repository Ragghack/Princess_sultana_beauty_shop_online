const prisma = require("../config/database");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const bcrypt = require("bcryptjs");

class UserController {
  /**
   * @route   GET /api/v1/users/profile
   * @desc    Get current user profile
   * @access  Private
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        deliveryZone: true,
        vehicleType: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json(new ApiResponse(200, user));
  });

  /**
   * @route   PATCH /api/v1/users/profile
   * @desc    Update current user profile
   * @access  Private
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, phone, deliveryZone, vehicleType } = req.body;

    // Validate phone if provided
    if (phone) {
      // Check if phone is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          phone,
          NOT: {
            id: userId,
          },
        },
      });

      if (existingUser) {
        throw new ApiError(400, "Ce numéro de téléphone est déjà utilisé");
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone, phoneVerified: true }), // Reset phone verification if changed
        ...(deliveryZone && { deliveryZone }),
        ...(vehicleType && { vehicleType }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        deliveryZone: true,
        vehicleType: true,
        updatedAt: true,
      },
    });

    res.status(200).json(new ApiResponse(200, user, "Profil mis à jour"));
  });

  /**
   * @route   PATCH /api/v1/users/password
   * @desc    Change password
   * @access  Private
   */
  changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Current password and new password are required");
    }

    if (newPassword.length < 6) {
      throw new ApiError(
        400,
        "Le nouveau mot de passe doit contenir au moins 6 caractères",
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, "Mot de passe actuel incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Mot de passe modifié avec succès"));
  });

  /**
   * @route   GET /api/v1/users/:id
   * @desc    Get user by ID (Admin only)
   * @access  Private (Admin)
   */
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        deliveryZone: true,
        vehicleType: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "Utilisateur non trouvé");
    }

    res.status(200).json(new ApiResponse(200, user));
  });

  /**
   * @route   GET /api/v1/users
   * @desc    Get all users (Admin only)
   * @access  Private (Admin)
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, status, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      deletedAt: null,
    };

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { phone: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          phoneVerified: true,
          deliveryZone: true,
          vehicleType: true,
          lastLoginAt: true,
          createdAt: true,
          orders: {
            include: { _count: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json(
      new ApiResponse(200, {
        users,
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
   * @route   GET /api/v1/users/customers
   * @desc    Get all users (Admin only)
   * @access  Private (Admin)
   */
  getAllCustomers = asyncHandler(async (req, res) => {
    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        deliveryZone: true,
        vehicleType: true,
        lastLoginAt: true,
        createdAt: true,
        orders: {
          include: { _count: true },
        },
      },
    });

    res.status(200).json(
      new ApiResponse(200, {
        customers,
      }),
    );
  });

  /**
   * @route   PATCH /api/v1/users/:id
   * @desc    Update user (Admin only)
   * @access  Private (Admin)
   */
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      email,
      role,
      status,
      deliveryZone,
      vehicleType,
    } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, "Utilisateur non trouvé");
    }

    // Check if email is already taken
    if (email && email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ApiError(400, "Cet email est déjà utilisé");
      }
    }

    // Check if phone is already taken
    if (phone && phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });
      if (existingPhone) {
        throw new ApiError(400, "Ce numéro est déjà utilisé");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(role && { role }),
        ...(status && { status }),
        ...(deliveryZone !== undefined && { deliveryZone }),
        ...(vehicleType !== undefined && { vehicleType }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        deliveryZone: true,
        vehicleType: true,
        updatedAt: true,
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Utilisateur mis à jour"));
  });

  /**
   * @route   DELETE /api/v1/users/:id
   * @desc    Soft delete user (Admin only)
   * @access  Private (Admin)
   */
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === req.user.id) {
      throw new ApiError(
        400,
        "Vous ne pouvez pas supprimer votre propre compte",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, "Utilisateur non trouvé");
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "INACTIVE",
      },
    });

    res.status(200).json(new ApiResponse(200, null, "Utilisateur supprimé"));
  });

  /**
   * @route   GET /api/v1/users/me/addresses
   * @desc    Get current user's addresses
   * @access  Private
   */
  getMyAddresses = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });

    res.status(200).json(new ApiResponse(200, addresses));
  });

  /**
   * @route   POST /api/v1/users/me/addresses
   * @desc    Add new address
   * @access  Private
   */
  addAddress = asyncHandler(async (req, res) => {
    const userId = req.user.id;
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

    if (!fullName || !phone || !street || !city || !region) {
      throw new ApiError(
        400,
        "Full name, phone, street, city, and region are required",
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
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

    res.status(201).json(new ApiResponse(201, address, "Adresse ajoutée"));
  });

  /**
   * @route   PATCH /api/v1/users/me/addresses/:id
   * @desc    Update address
   * @access  Private
   */
  updateAddress = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress || existingAddress.userId !== userId) {
      throw new ApiError(404, "Adresse non trouvée");
    }

    // If setting as default, unset other defaults
    if (req.body.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
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
   * @route   DELETE /api/v1/users/me/addresses/:id
   * @desc    Delete address
   * @access  Private
   */
  deleteAddress = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== userId) {
      throw new ApiError(404, "Adresse non trouvée");
    }

    await prisma.address.delete({
      where: { id },
    });

    res.status(200).json(new ApiResponse(200, null, "Adresse supprimée"));
  });
}

module.exports = new UserController();
