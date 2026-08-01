const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const mongoUrl = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/hairshop";
const client = new MongoClient(mongoUrl);
let db;

async function connectDatabase() {
  if (!db) {
    await client.connect();
    const parsedUrl = new URL(mongoUrl);
    const dbName = parsedUrl.pathname.replace(/^\/+/, "") || "hairshop";
    db = client.db(dbName);
  }

  return db;
}

async function main() {
  console.log("🌱 Starting database seed...");

  const database = await connectDatabase();
  const collectionsToClear = [
    "order_status_history",
    "order_items",
    "orders",
    "bundle_items",
    "bundles",
    "cart_items",
    "carts",
    "reviews",
    "wishlist_items",
    "product_images",
    "products",
    "addresses",
    "discount_codes",
    "refresh_tokens",
    "users",
    "system_settings",
  ];

  for (const collectionName of collectionsToClear) {
    await database.collection(collectionName).deleteMany({});
  }

  console.log("✅ Cleared existing data");

  const timestamp = new Date();
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  await database.collection("users").insertOne({
    _id: new ObjectId(),
    email: "admin@princesse-sultana.cm",
    phone: "+237670000001",
    password: adminPassword,
    firstName: "Admin",
    lastName: "Sultana",
    role: "ADMIN",
    status: "ACTIVE",
    emailVerified: true,
    phoneVerified: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  console.log("✅ Created admin user");

  const staffPassword = await bcrypt.hash("Staff@123", 12);
  await database.collection("users").insertOne({
    _id: new ObjectId(),
    email: "staff@princesse-sultana.cm",
    phone: "+237670000002",
    password: staffPassword,
    firstName: "Marie",
    lastName: "Kamga",
    role: "STAFF",
    status: "ACTIVE",
    emailVerified: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  console.log("✅ Created staff user");

  const deliveryPassword = await bcrypt.hash("Delivery@123", 12);
  await database.collection("users").insertOne({
    _id: new ObjectId(),
    email: "delivery@princesse-sultana.cm",
    phone: "+237670000003",
    password: deliveryPassword,
    firstName: "Jean",
    lastName: "Mbarga",
    role: "DELIVERY",
    status: "ACTIVE",
    emailVerified: true,
    deliveryZone: "Douala - Akwa",
    vehicleType: "Moto",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  console.log("✅ Created delivery personnel");

  const customerPassword = await bcrypt.hash("Customer@123", 12);
  await database.collection("users").insertMany([
    {
      _id: new ObjectId(),
      email: "customer1@example.com",
      phone: "+237670000004",
      password: customerPassword,
      firstName: "Grace",
      lastName: "Nkolo",
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerified: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      _id: new ObjectId(),
      email: "customer2@example.com",
      phone: "+237670000005",
      password: customerPassword,
      firstName: "Aminata",
      lastName: "Diop",
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerified: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]);

  console.log("✅ Created customer users");

  await database.collection("system_settings").insertMany([
    {
      _id: new ObjectId(),
      key: "DELIVERY_FEE",
      value: "1000",
      description: "Frais de livraison standard",
      updatedAt: timestamp,
    },
    {
      _id: new ObjectId(),
      key: "ADMIN_EMAIL",
      value: "admin@princesse-sultana.cm",
      description: "Email administrateur",
      updatedAt: timestamp,
    },
    {
      _id: new ObjectId(),
      key: "ADMIN_WHATSAPP",
      value: "+237670000001",
      description: "Numéro WhatsApp administrateur",
      updatedAt: timestamp,
    },
    {
      _id: new ObjectId(),
      key: "SHOP_NAME",
      value: "Princesse Sultana Hair Care",
      description: "Nom de la boutique",
      updatedAt: timestamp,
    },
    {
      _id: new ObjectId(),
      key: "LOW_STOCK_THRESHOLD",
      value: "10",
      description: "Seuil de stock faible",
      updatedAt: timestamp,
    },
    {
      _id: new ObjectId(),
      key: "CURRENCY",
      value: "XAF",
      description: "Devise",
      updatedAt: timestamp,
    },
    {
      _id: new ObjectId(),
      key: "TAX_RATE",
      value: "0",
      description: "Taux de taxe (%)",
      updatedAt: timestamp,
    },
  ]);

  console.log("✅ Created system settings");

  console.log("\n🎉 Database seed completed successfully!");
  console.log("\n📝 Test Credentials:");
  console.log("─────────────────────────────────────");
  console.log("Admin:");
  console.log("  Email: admin@princesse-sultana.cm");
  console.log("  Password: Admin@123");
  console.log("\nStaff:");
  console.log("  Email: staff@princesse-sultana.cm");
  console.log("  Password: Staff@123");
  console.log("\nDelivery:");
  console.log("  Email: delivery@princesse-sultana.cm");
  console.log("  Password: Delivery@123");
  console.log("\nCustomer:");
  console.log("  Email: customer1@example.com");
  console.log("  Password: Customer@123");
  console.log("─────────────────────────────────────");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await client.close();
  });
