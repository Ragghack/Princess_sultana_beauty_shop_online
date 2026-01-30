// const https = require("https");
// const fs = require("fs");
// const path = require("path");
import https from "https";
import fs from "fs";
import path from "path";

// Create directories
const dirs = [
  "public/images",
  "public/images/products",
  "public/images/hero",
  "public/images/placeholders",
];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Image URLs
const images = {
  // Product Images
  "products/coconut-oil.jpg":
    "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&h=800&fit=crop&q=80",
  "products/argan-oil.jpg":
    "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&h=800&fit=crop&q=80",
  "products/castor-oil.jpg":
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop&q=80",
  "products/moisturizing-shampoo.jpg":
    "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&h=800&fit=crop&q=80",
  "products/clarifying-shampoo.jpg":
    "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&h=800&fit=crop&q=80",
  "products/growth-activator.jpg":
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop&q=80",
  "products/strengthening-serum.jpg":
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop&q=80",
  "products/brazilian-bundle.jpg":
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&h=800&fit=crop&q=80",
  "products/peruvian-bundle.jpg":
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=800&fit=crop&q=80",
  "products/deep-conditioner.jpg":
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop&q=80",
  "products/protein-mask.jpg":
    "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=800&fit=crop&q=80",

  // Hero/Banner Images
  "hero/hero-banner.jpg":
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&h=800&fit=crop&q=80",
  "hero/about-hero.jpg":
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=600&fit=crop&q=80",

  // Placeholder
  "placeholders/product-placeholder.jpg":
    "https://via.placeholder.com/800x800/F4B8C5/FFFFFF?text=Product",
};

// Download function
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join("public/images", filepath));

    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`✓ Downloaded: ${filepath}`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {});
        console.error(`✗ Failed: ${filepath}`, err.message);
        reject(err);
      });
  });
}

// Download all images
async function downloadAll() {
  console.log("🖼️  Downloading images...\n");

  const downloads = Object.entries(images).map(([filepath, url]) =>
    downloadImage(url, filepath),
  );

  try {
    await Promise.all(downloads);
    console.log("\n✅ All images downloaded successfully!");
  } catch (error) {
    console.error("\n❌ Some images failed to download");
  }
}

downloadAll();
