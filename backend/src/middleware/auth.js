const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");
const { jwtSecret } = require("../config/jwt");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

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
  if (typeof id === "string" && /^[a-f0-9]{24}$/i.test(id)) {
    return new ObjectId(id);
  }
  return id;
}

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

    const database = await getMongoDatabase();
    const user = await database.collection("users").findOne(
      { _id: normalizeObjectId(decoded.userId) },
      {
        projection: {
          _id: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          role: 1,
          status: 1,
        },
      },
    );

    if (!user) {
      throw new ApiError(401, "user not found");
    }

    if (user.status !== "ACTIVE") {
      throw new ApiError(401, "Compte désactivé");
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    };
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