const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { limiter } = require("./middleware/rateLimiter");
const ApiError = require("./utils/ApiError");

const app = express();
// Backend URL configuration
const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://princess-sultana-beauty-shop-online-k0fh.onrender.com";

// ============= DIRECTORY SETUP =============
const uploadDirs = [
  "uploads",
  "uploads/products",
  "uploads/bundles",
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

// ============= SECURITY =============
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
          "http://localhost:*",
          "https://localhost:*",
          process.env.FRONTEND_URL,
          BACKEND_URL,
          "*",
        ].filter(Boolean),
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL,
          BACKEND_URL,
          "*",
        ],
        mediaSrc: ["'self'", "*"],
        workerSrc: ["'self'", "blob:"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// ============= CORS =============
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,https://princess-sultana-beauty-shop-online-qv9q0c9a0.vercel.app"
  
)
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Blocked CORS from: ${origin}`);
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  })
);

// ============= BODY PARSERS =============
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 50000 }));

// ============= IMAGE SERVING =============
// FIXED: req.url inside /uploads handler is already relative to /uploads
// e.g. req.url = "/products/filename.png"
// So the correct disk path is: __dirname + "/uploads" + req.url
// NOT: __dirname + req.url  (that was the bug — missing the "uploads" segment)

app.use("/uploads", (req, res, next) => {
  // Correct disk path: backend/uploads/products/filename.png
  const diskPath = path.join(__dirname, "uploads", req.url);

  console.log("🖼️  Image request:");
  console.log("   URL      :", `/uploads${req.url}`);
  console.log("   Disk path:", diskPath);
  console.log("   Exists   :", fs.existsSync(diskPath) ? "✅ YES" : "❌ NO");

  // Set headers to allow cross-origin image loading
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cache-Control": "public, max-age=86400",
  });

  next(); // always pass to express.static
});

// Serve the actual files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============= LOGGING =============
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ============= RATE LIMITING =============
app.use("/api", limiter);

// ============= API CACHE CONTROL =============
app.use("/api", (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
  next();
});

// ============= SLOW REQUEST DETECTOR =============
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    if (ms > 1000) {
      console.warn(`⚠️ Slow: ${req.method} ${req.url} — ${ms}ms`);
    }
  });
  next();
});

// ============= CONTROL PANEL =============
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
    res.status(500).json({ error: "Failed to scan uploads directory" });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ============= WELCOME ROUTE =============
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Sultana Beauty API",
    version: "1.0.0",
    documentation: { base_url: "/api/v1" },
  });
});

app.get("/api/v1", (req, res) => {
  res.json({
    success: true,
    message: "Sultana Beauty API v1",
    images: {
      baseUrl: `${BACKEND_URL}/uploads`,
    },
    status: "operational",
    timestamp: new Date().toISOString(),
  });
});

// ============= API ROUTES =============
app.use("/api/v1", routes);

// ============= 404 HANDLER =============
app.use("*", (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// ============= ERROR HANDLER =============
app.use(errorHandler);

// ============= GRACEFUL SHUTDOWN =============
const gracefulShutdown = () => {
  console.log("🔄 Shutting down gracefully...");
  setTimeout(() => {
    console.log("✅ Shutdown complete");
    process.exit(0);
  }, 3000);
};
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

module.exports = app;