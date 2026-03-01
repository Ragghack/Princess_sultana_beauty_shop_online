const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { limiter } = require("./middleware/rateLimiter");
const ApiError = require("./utils/ApiError");

const app = express();

// Security middleware
app.use(helmet());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use((req, res, next) => {
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
app.use("/api", limiter);

// ============= ADD WELCOME ROUTES HERE =============
// Root route - redirect to API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Sultana Beauty API",
    version: "1.0.0",
    documentation: {
      base_url: "/api/v1",
      endpoints: {
        products: "/api/v1/products",
        users: "/api/v1/users",
        orders: "/api/v1/orders",
        auth: "/api/v1/auth",
        cart: "/api/v1/cart",
        reviews: "/api/v1/reviews",
        bundles: "/api/v1/bundles"
      }
    }
  });
});

// API base route - show available endpoints
app.get("/api/v1", (req, res) => {
  res.json({
    success: true,
    message: "Sultana Beauty API v1",
    endpoints: {
      products: {
        list: "GET /api/v1/products",
        detail: "GET /api/v1/products/:id",
        create: "POST /api/v1/products",
        update: "PATCH /api/v1/products/:id",
        delete: "DELETE /api/v1/products/:id"
      },
      users: {
        list: "GET /api/v1/users",
        profile: "GET /api/v1/users/profile",
        update: "PATCH /api/v1/users/profile"
      },
      auth: {
        register: "POST /api/v1/auth/register",
        login: "POST /api/v1/auth/login",
        refresh: "POST /api/v1/auth/refresh-token",
        logout: "POST /api/v1/auth/logout"
      },
      orders: {
        list: "GET /api/v1/orders",
        create: "POST /api/v1/orders",
        detail: "GET /api/v1/orders/:id"
      },
      cart: {
        get: "GET /api/v1/cart",
        add: "POST /api/v1/cart/items",
        update: "PUT /api/v1/cart/items/:itemId",
        remove: "DELETE /api/v1/cart/items/:itemId"
      }
    },
    status: "operational",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// ============= API ROUTES =============
app.use("/api/v1", routes);

// ============= 404 HANDLER =============
// This catches all unmatched routes
app.use("*", (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} non trouvée`);
  next(error);
});

// ============= ERROR HANDLER =============
// This must be the last middleware
app.use(errorHandler);
// In app.js, add this middleware BEFORE your routes
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});
module.exports = app;