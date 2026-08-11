const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");
const {
  jwtSecret,
  jwtExpiresIn,
  jwtRefreshSecret,
  jwtRefreshExpiresIn,
} = require("../config/jwt");
const ApiError = require("../utils/ApiError");

const mongoUrl = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/hairshop";
let mongoClient;
let mongoDb;

async function getMongoDatabase() {
  if (mongoDb) return mongoDb;

  try {
    // Extract the db name via regex instead of the URL class, since
    // standard (non-SRV) connection strings can list multiple
    // comma-separated hosts, which new URL() cannot parse.
    const dbNameMatch = mongoUrl.match(/\/([^/?]+)(\?|$)/);
    const dbName = (dbNameMatch && dbNameMatch[1]) || "hairshop";
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
  if (typeof id === "string" && id.length === 24) {
    return new ObjectId(id);
  }
  return id;
}

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    const { email, phone, password, firstName, lastName } = userData;

    const database = await getMongoDatabase();

    // Check if user exists
    const existingUser = await database.collection("users").findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      throw new ApiError(400, "Email ou téléphone déjà utilisé");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();
    const userId = new ObjectId();

    // Create user
    await database.collection("users").insertOne({
      _id: userId,
      email,
      phone,
      password: hashedPassword,
      firstName,
      lastName,
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerified: false,
      phoneVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create cart for user
    await database.collection("carts").insertOne({
      _id: new ObjectId(),
      userId,
      createdAt: now,
      updatedAt: now,
    });

    const user = {
      id: userId.toString(),
      email,
      phone,
      firstName,
      lastName,
      role: "CUSTOMER",
    };

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return { user, ...tokens };
  }

  /**
   * Login user
   */
  async login(email, password) {
    const database = await getMongoDatabase();

    // Find user
    const user = await database.collection("users").findOne({ email });

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

    const userId = user._id.toString();

    // Update last login
    await database.collection("users").updateOne(
      { _id: normalizeObjectId(userId) },
      { $set: { lastLoginAt: new Date() } },
    );

    // Generate tokens
    const tokens = await this.generateTokens(userId);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: {
        id: userId,
        email: userWithoutPassword.email,
        firstName: userWithoutPassword.firstName,
        lastName: userWithoutPassword.lastName,
        role: userWithoutPassword.role,
        status: userWithoutPassword.status,
        phone: userWithoutPassword.phone,
        addresses: [],
      },
      ...tokens,
    };
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
    const database = await getMongoDatabase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await database.collection("refresh_tokens").insertOne({
      _id: new ObjectId(),
      token: refreshToken,
      userId: normalizeObjectId(userId),
      expiresAt,
      createdAt: new Date(),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, jwtRefreshSecret);

      const database = await getMongoDatabase();

      // Check if refresh token exists in database
      const storedToken = await database
        .collection("refresh_tokens")
        .findOne({ token: refreshToken });

      if (!storedToken) {
        throw new ApiError(401, "Token invalide");
      }

      if (storedToken.expiresAt < new Date()) {
        await database.collection("refresh_tokens").deleteOne({ token: refreshToken });
        throw new ApiError(401, "Token expiré");
      }

      // Delete old refresh token
      await database.collection("refresh_tokens").deleteOne({ token: refreshToken });

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
    const database = await getMongoDatabase();
    await database.collection("refresh_tokens").deleteMany({ token: refreshToken });
  }
}

module.exports = new AuthService();