const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");
const {
  jwtSecret,
  jwtExpiresIn,
  jwtRefreshSecret,
  jwtRefreshExpiresIn,
} = require("../config/jwt");
const ApiError = require("../utils/ApiError");

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    const { email, phone, password, firstName, lastName } = userData;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new ApiError(400, "Email ou téléphone déjà utilisé");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Create cart for user
    await prisma.cart.create({
      data: {
        userId: user.id,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return { user, ...tokens };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(401, "Email ou mot de passe incorrect");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Email ou mot de passe incorrect");
    }

    // Check if user is active
    if (user.status !== "ACTIVE") {
      throw new ApiError(401, "Compte désactivé");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    const refreshToken = jwt.sign({ userId }, jwtRefreshSecret, {
      expiresIn: jwtRefreshExpiresIn,
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, jwtRefreshSecret);

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        throw new ApiError(401, "Token invalide");
      }

      if (storedToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { token: refreshToken } });
        throw new ApiError(401, "Token expiré");
      }

      // Delete old refresh token
      await prisma.refreshToken.delete({ where: { token: refreshToken } });

      // Generate new tokens
      const tokens = await this.generateTokens(decoded.userId);

      return tokens;
    } catch (error) {
      throw new ApiError(401, "Token invalide");
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }
}

module.exports = new AuthService();
