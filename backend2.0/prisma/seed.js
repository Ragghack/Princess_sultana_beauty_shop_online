const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");
  // Clear existing data (in correct order to respect foreign keys)
 await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bundleItem.deleteMany(); // NEW
  await prisma.bundle.deleteMany(); // NEW
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();

  console.log("✅ Cleared existing data");

  // Create Admin User
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@princesse-sultana.cm",
      phone: "+237670000001",
      password: adminPassword,
      firstName: "Admin",
      lastName: "Sultana",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log("✅ Created admin user");

  // Create Staff User
  const staffPassword = await bcrypt.hash("Staff@123", 12);
  const staff = await prisma.user.create({
    data: {
      email: "staff@princesse-sultana.cm",
      phone: "+237670000002",
      password: staffPassword,
      firstName: "Marie",
      lastName: "Kamga",
      role: "STAFF",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  console.log("✅ Created staff user");

  // Create Delivery Personnel
  const deliveryPassword = await bcrypt.hash("Delivery@123", 12);
  const delivery = await prisma.user.create({
    data: {
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
    },
  });

  console.log("✅ Created delivery personnel");

  // Create Customer Users
  const customerPassword = await bcrypt.hash("Customer@123", 12);
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: "customer1@example.com",
        phone: "+237670000004",
        password: customerPassword,
        firstName: "Grace",
        lastName: "Nkolo",
        role: "CUSTOMER",
        status: "ACTIVE",
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "customer2@example.com",
        phone: "+237670000005",
        password: customerPassword,
        firstName: "Aminata",
        lastName: "Diop",
        role: "CUSTOMER",
        status: "ACTIVE",
        emailVerified: true,
      },
    }),
  ]);

  console.log("✅ Created customer users");

  // Create System Settings
  await prisma.systemSettings.createMany({
    data: [
      {
        key: "DELIVERY_FEE",
        value: "1000",
        description: "Frais de livraison standard",
      },
      {
        key: "ADMIN_EMAIL",
        value: "admin@princesse-sultana.cm",
        description: "Email administrateur",
      },
      {
        key: "ADMIN_WHATSAPP",
        value: "+237670000001",
        description: "Numéro WhatsApp administrateur",
      },
      {
        key: "SHOP_NAME",
        value: "Princesse Sultana Hair Care",
        description: "Nom de la boutique",
      },
      {
        key: "LOW_STOCK_THRESHOLD",
        value: "10",
        description: "Seuil de stock faible",
      },
      {
        key: "CURRENCY",
        value: "XAF",
        description: "Devise",
      },
      {
        key: "TAX_RATE",
        value: "0",
        description: "Taux de taxe (%)",
      },
    ],
  });

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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
