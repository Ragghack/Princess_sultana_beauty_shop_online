const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  // Prisma errors
  if (err.code === "P2002") {
    error = new ApiError(400, "Cette valeur existe déjà");
  }

  if (err.code === "P2025") {
    error = new ApiError(404, "Ressource non trouvée");
  }

  // Validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, message);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Token invalide");
  }
  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Token expiré");
  }
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Erreur serveur",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
module.exports = errorHandler;
