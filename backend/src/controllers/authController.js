const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { MongoClient, ObjectId } = require("mongodb");
const authService = require("../services/authService");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const mongoUrl = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/hairshop";
let mongoClient;
let mongoDb;

async function getMongoDatabase() {
  if (mongoDb) return mongoDb;

  try {
    const parsedUrl = new URL(mongoUrl);
    const dbName = parsedUrl.pathname.replace(/^\/+/, "") || "hairshop";
    const client = new MongoClient(mongoUrl);
    await client.connect();
    mongoClient = client;
    mongoDb = client.db(dbName);
    return mongoDb;
  } catch (error) {
    mongoClient = null;
    mongoDb = null;
    throw error;
  }
}

function normalizeObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && /^[a-f0-9]{24}$/i.test(id)) {
    return new ObjectId(id);
  }
  return id;
}

class AuthController {
  /**
   * @route   POST /api/v1/auth/register
   * @desc    Register new user
   * @access  Public
   */
  register = asyncHandler(async (req, res) => {
    const { email, phone, password, firstName, lastName } = req.body;

    const result = await authService.register({
      email,
      phone,
      password,
      firstName,
      lastName,
    });

    res.status(201).json(new ApiResponse(201, result, "Inscription réussie"));
  });

  /**
   * @route   POST /api/v1/auth/login
   * @desc    Login user
   * @access  Public
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json(new ApiResponse(200, result, "Connexion réussie"));
  });

  /**
   * @route   POST /api/v1/auth/refresh-token
   * @desc    Refresh access token
   * @access  Public
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json(new ApiResponse(200, tokens, "Token renouvelé"));
  });

  /**
   * @route   POST /api/v1/auth/logout
   * @desc    Logout user
   * @access  Private
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    res.status(200).json(new ApiResponse(200, null, "Déconnexion réussie"));
  });

  /**
   * @route   GET /api/v1/auth/me
   * @desc    Get current user
   * @access  Private
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const database = await getMongoDatabase();
    const user = await database.collection("users").findOne(
      { _id: normalizeObjectId(req.user.id) },
      {
        projection: {
          _id: 1,
          email: 1,
          phone: 1,
          firstName: 1,
          lastName: 1,
          role: 1,
        },
      },
    );

    if (!user) {
      throw new ApiError(404, "Utilisateur non trouvé");
    }

    res.status(200).json(
      new ApiResponse(200, {
        id: user._id.toString(),
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }, "Utilisateur récupéré")
    );
  });
}

module.exports = new AuthController();