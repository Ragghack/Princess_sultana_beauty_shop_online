const ApiError = require("../utils/ApiError");

/**
 * Authorize user based on roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentification requise");
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Accès refusé");
    }

    next();
  };
};

module.exports = authorize;
