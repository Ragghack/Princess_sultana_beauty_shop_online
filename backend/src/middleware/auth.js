const jwt = require("jsonwebtoken");
const prisma = require("../config/database");
const { jwtSecret } = require("../config/jwt");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Authenticate user with JWT
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Authentification requise");
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "user not found");
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError(401, "Compte désactivé");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expiré. Veuillez vous reconnecter.");
    }
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Token invalide.");
    }
    throw new ApiError(401, "Échec d'authentification.");
  }
});

module.exports = authenticate;
