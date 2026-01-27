const { body, param, query, validationResult } = require("express-validator");
const ApiError = require("./ApiError");

/**
 * Validate request and throw error if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    throw new ApiError(400, errorMessages.join(", "));
  }
  next();
};

/**
 * Validation rules
 */
const validations = {
  // Auth validations
  register: [
    body("email").isEmail().withMessage("Email invalide"),
    body("phone")
      .isMobilePhone("fr-CM")
      .withMessage("Numéro de téléphone invalide"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Le mot de passe doit contenir au moins 8 caractères"),
    body("firstName").notEmpty().withMessage("Prénom requis"),
    body("lastName").notEmpty().withMessage("Nom requis"),
  ],

  login: [
    body("email").isEmail().withMessage("Email invalide"),
    body("password").notEmpty().withMessage("Mot de passe requis"),
  ],

  // Product validations
  createProduct: [
    body("name").notEmpty().withMessage("Nom du produit requis"),
    body("price").isFloat({ min: 0 }).withMessage("Prix invalide"),
    body("category").notEmpty().withMessage("Catégorie requise"),
    body("stockQuantity")
      .isInt({ min: 0 })
      .withMessage("Quantité en stock invalide"),
  ],

  // Order validations
  createOrder: [
    body("addressId").isUUID().withMessage("Adresse invalide"),
    body("paymentMethod")
      .isIn(["MOBILE_MONEY", "ORANGE_MONEY", "CASH_ON_DELIVERY"])
      .withMessage("Mode de paiement invalide"),
    body("items").isArray({ min: 1 }).withMessage("Au moins un article requis"),
  ],

  // Discount validations
  validateDiscountCode: [
    body("code").notEmpty().withMessage("Code promo requis"),
  ],
};

module.exports = { validate, validations };
