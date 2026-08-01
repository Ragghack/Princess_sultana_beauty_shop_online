const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const fsPromises = require("fs").promises;

const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { limiter } = require("./middleware/rateLimiter");
const ApiError = require("./utils/ApiError");

const app = express();

/*
|--------------------------------------------------------------------------
| Environment Configuration
|--------------------------------------------------------------------------
*/

const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://princess-sultana-beauty-shop-online-k0fh.onrender.com";

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "princess-sultana-beauty-shop-online-dwma5aatw.vercel.app";

/*
|--------------------------------------------------------------------------
| Directory Setup
|--------------------------------------------------------------------------
*/

const uploadDirs = [
  "uploads",
  "uploads/products",
  "uploads/bundles",
  "uploads/payment-proofs",
  "uploads/temp",
  "logs",
];

uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

/*
|--------------------------------------------------------------------------
| Security Middleware
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],

        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          FRONTEND_URL,
          BACKEND_URL,
          "http://localhost:*",
          "https://localhost:*",
        ],

        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],

        fontSrc: [
          "'self'",
          "data:",
          "https://fonts.gstatic.com",
        ],

        connectSrc: [
          "'self'",
          FRONTEND_URL,
          BACKEND_URL,
        ],

        mediaSrc: ["'self'", BACKEND_URL],
        workerSrc: ["'self'", "blob:"],
      },
    },

    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
*/

const allowedOrigins = [
  FRONTEND_URL,
   "https://sultanacare.com",        // ✅ ADD THIS
  "https://www.sultanacare.com",    // ✅ ADD THIS
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

const corsOptions = {
  origin: function (origin, callback) {

    // Allow server tools like Postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️ Blocked CORS from: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],

  exposedHeaders: [
    "Content-Range",
    "X-Content-Range",
  ],
};

app.use(cors(corsOptions));

/* Handle Preflight Requests */
app.options("*", cors(corsOptions));

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/

app.use(express.json({ limit: "50mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 50000,
  })
);

/*
|--------------------------------------------------------------------------
| Static Uploads
|--------------------------------------------------------------------------
*/

app.use("/uploads", (req, res, next) => {

  const diskPath = path.join(__dirname, "uploads", req.url);

  console.log("🖼️ Image request:");
  console.log("URL:", `/uploads${req.url}`);
  console.log("Disk:", diskPath);
  console.log("Exists:", fs.existsSync(diskPath));

  res.set({
    "Access-Control-Allow-Origin": "*",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cache-Control": "public, max-age=86400",
  });

  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*
|--------------------------------------------------------------------------
| Logging
|--------------------------------------------------------------------------
*/

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

/*
|--------------------------------------------------------------------------
| Rate Limiting
|--------------------------------------------------------------------------
*/

app.use("/api", limiter);

/*
|--------------------------------------------------------------------------
| API Cache Control
|--------------------------------------------------------------------------
*/

app.use("/api", (req, res, next) => {

  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  next();
});

/*
|--------------------------------------------------------------------------
| Slow Request Monitor
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {

  const start = Date.now();

  res.on("finish", () => {

    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.url} (${duration}ms)`);
    }

  });

  next();
});

/*
|--------------------------------------------------------------------------
| Control Panel Endpoint
|--------------------------------------------------------------------------
*/

app.get("/control/images", async (req, res) => {

  try {

    const uploadsDir = path.join(__dirname, "uploads");
    const categories = await fsPromises.readdir(uploadsDir);

    const images = {};

    for (const cat of categories) {

      const catPath = path.join(uploadsDir, cat);
      const stat = await fsPromises.stat(catPath);

      if (stat.isDirectory()) {

        const files = await fsPromises.readdir(catPath);

        images[cat] = files.filter((f) =>
          /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f)
        );
      }
    }

    res.json({
      success: true,
      total: Object.values(images).flat().length,
      byCategory: images,
      baseUrl: `${BACKEND_URL}/uploads`,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Failed to scan uploads directory",
    });

  }

});

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {

  res.status(200).json({
    success: true,
    message: "Server healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });

});

/*
|--------------------------------------------------------------------------
| Root Routes
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {

  res.json({
    success: true,
    message: "Welcome to Sultana Beauty API",
    version: "1.0.0",
    docs: "/api/v1",
  });

});

app.get("/api/v1", (req, res) => {

  res.json({
    success: true,
    message: "Sultana Beauty API v1",
    images: {
      baseUrl: `${BACKEND_URL}/uploads`,
    },
  });

});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/v1", routes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use("*", (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Graceful Shutdown
|--------------------------------------------------------------------------
*/

const gracefulShutdown = () => {

  console.log("🔄 Graceful shutdown initiated");

  setTimeout(() => {
    console.log("✅ Server closed");
    process.exit(0);
  }, 3000);

};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

module.exports = app;