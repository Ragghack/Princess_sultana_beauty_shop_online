const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
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

  // Create Addresses for customers
  await prisma.address.create({
    data: {
      userId: customers[0].id,
      fullName: "Grace Nkolo",
      phone: "+237670000004",
      street: "Rue de la Joie, Akwa",
      city: "Douala",
      region: "Littoral",
      landmark: "Près du marché central",
      isDefault: true,
    },
  });

  await prisma.address.create({
    data: {
      userId: customers[1].id,
      fullName: "Aminata Diop",
      phone: "+237670000005",
      street: "Avenue Kennedy, Bonapriso",
      city: "Douala",
      region: "Littoral",
      landmark: "Près de la pharmacie",
      isDefault: true,
    },
  });

  console.log("✅ Created addresses");

  // Create Carts for customers
  await Promise.all(
    customers.map((customer) =>
      prisma.cart.create({
        data: {
          userId: customer.id,
        },
      }),
    ),
  );

  console.log("✅ Created carts");

  // Create Products
  const products = [
    // Hair Oils
    {
      sku: "HAI-COCO-A1B2",
      name: "Huile de Coco Vierge Bio",
      slug: "huile-de-coco-vierge-bio",
      description:
        "Huile de coco 100% pure et naturelle, pressée à froid pour conserver tous ses bienfaits. Hydrate en profondeur, répare les cheveux abîmés et stimule la croissance. Idéale pour tous types de cheveux, particulièrement les cheveux secs et cassants.",
      shortDescription: "Huile de coco pure pour cheveux brillants et sains",
      category: "HAIR_OIL",
      status: "ACTIVE",
      price: 8500,
      compareAtPrice: 12000,
      cost: 5000,
      stockQuantity: 50,
      weight: 250,
      volume: 250,
      featuredImage:
        "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800",
      featured: true,
    },
    {
      sku: "HAI-ARGAN-C3D4",
      name: "Huile d'Argan Pure du Maroc",
      slug: "huile-argan-pure-maroc",
      description:
        "L'huile d'argan marocaine est reconnue mondialement pour ses propriétés nourrissantes exceptionnelles. Riche en vitamine E et en acides gras essentiels, elle redonne brillance, souplesse et vitalité aux cheveux ternes et fatigués.",
      shortDescription: "Huile d'argan marocaine pour cheveux brillants",
      category: "HAIR_OIL",
      status: "ACTIVE",
      price: 15000,
      compareAtPrice: 20000,
      cost: 9000,
      stockQuantity: 30,
      weight: 100,
      volume: 100,
      featuredImage:
        "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800",
      featured: true,
    },
    {
      sku: "HAI-CAST-E5F6",
      name: "Huile de Ricin Jamaïcaine Noire",
      slug: "huile-ricin-jamaicaine-noire",
      description:
        "L'huile de ricin jamaïcaine noire est le secret des cheveux longs et épais. Elle stimule la pousse, renforce les racines et épaissit les cheveux fins. Parfaite pour les cheveux crépus et frisés.",
      shortDescription: "Stimule la croissance et épaissit les cheveux",
      category: "HAIR_OIL",
      status: "ACTIVE",
      price: 12000,
      compareAtPrice: 16000,
      cost: 7000,
      stockQuantity: 40,
      weight: 200,
      volume: 200,
      featuredImage:
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
      featured: false,
    },

    // Shampoos
    {
      sku: "SHA-MOIS-G7H8",
      name: "Shampooing Hydratant Karité & Aloe Vera",
      slug: "shampooing-hydratant-karite-aloe-vera",
      description:
        "Shampooing doux sans sulfates, enrichi en beurre de karité et aloe vera. Nettoie en douceur tout en hydratant intensément. Convient aux cheveux naturels, colorés et traités chimiquement.",
      shortDescription: "Nettoie et hydrate sans agresser",
      category: "SHAMPOO",
      status: "ACTIVE",
      price: 7500,
      compareAtPrice: 10000,
      cost: 4500,
      stockQuantity: 60,
      weight: 350,
      volume: 350,
      featuredImage:
        "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800",
      featured: true,
    },
    {
      sku: "SHA-CLAR-I9J0",
      name: "Shampooing Clarifiant au Thé Vert",
      slug: "shampooing-clarifiant-the-vert",
      description:
        "Shampooing purifiant qui élimine les résidus de produits et les impuretés sans dessécher. Enrichi au thé vert pour ses propriétés antioxydantes. Utilisation hebdomadaire recommandée.",
      shortDescription: "Purifie et détoxifie le cuir chevelu",
      category: "SHAMPOO",
      status: "ACTIVE",
      price: 8000,
      cost: 4800,
      stockQuantity: 45,
      weight: 300,
      volume: 300,
      featuredImage:
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800",
      featured: false,
    },

    // Growth Serums
    {
      sku: "GRO-ACTI-K1L2",
      name: "Sérum Activateur de Pousse",
      slug: "serum-activateur-pousse",
      description:
        "Sérum concentré aux huiles essentielles de romarin, menthe poivrée et gingembre. Stimule la circulation sanguine du cuir chevelu, réveille les follicules dormants et accélère la pousse. Résultats visibles en 4-6 semaines.",
      shortDescription: "Accélère la pousse des cheveux naturellement",
      category: "GROWTH_SERUM",
      status: "ACTIVE",
      price: 18000,
      compareAtPrice: 25000,
      cost: 11000,
      stockQuantity: 25,
      weight: 60,
      volume: 60,
      featuredImage:
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
      featured: true,
    },
    {
      sku: "GRO-FORT-M3N4",
      name: "Sérum Fortifiant Anti-Casse",
      slug: "serum-fortifiant-anti-casse",
      description:
        "Sérum protéiné qui renforce la fibre capillaire de la racine aux pointes. Réduit la casse de 80% dès 2 semaines. Enrichi en kératine végétale et biotine.",
      shortDescription: "Réduit la casse et renforce les cheveux",
      category: "GROWTH_SERUM",
      status: "ACTIVE",
      price: 16000,
      cost: 9500,
      stockQuantity: 35,
      weight: 50,
      volume: 50,
      featuredImage:
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800",
      featured: false,
    },

    // Hair Bundles
    {
      sku: "BUN-BRAZ-O5P6",
      name: "Tissage Brésilien Ondulé - 14 pouces",
      slug: "tissage-bresilien-ondule-14",
      description:
        "Tissage 100% cheveux humains vierges brésiliens. Texture ondulée naturelle, doux et soyeux. Peut être coloré, lissé ou bouclé. Durée de vie: 12-18 mois avec bon entretien.",
      shortDescription: "Cheveux vierges brésiliens ondulés",
      category: "HAIR_BUNDLE",
      status: "ACTIVE",
      price: 45000,
      compareAtPrice: 60000,
      cost: 28000,
      stockQuantity: 15,
      weight: 100,
      bundleLength: "14 pouces",
      featuredImage:
        "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800",
      featured: true,
    },
    {
      sku: "BUN-PERU-Q7R8",
      name: "Tissage Péruvien Lisse - 18 pouces",
      slug: "tissage-peruvien-lisse-18",
      description:
        "Tissage péruvien ultra-lisse et brillant. Cheveux vierges de qualité premium. Tient les boucles parfaitement. Idéal pour un look sophistiqué.",
      shortDescription: "Cheveux péruviens lisses premium",
      category: "HAIR_BUNDLE",
      status: "ACTIVE",
      price: 65000,
      cost: 40000,
      stockQuantity: 10,
      weight: 100,
      bundleLength: "18 pouces",
      featuredImage:
        "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800",
      featured: false,
    },

    // Conditioners
    {
      sku: "CON-DEEP-S9T0",
      name: "Après-Shampooing Hydratant Intense",
      slug: "apres-shampooing-hydratant-intense",
      description:
        "Après-shampooing crémeux aux beurres de karité et de mangue. Démêle instantanément, nourrit en profondeur et laisse les cheveux doux comme de la soie. Sans parabènes ni silicones.",
      shortDescription: "Démêle et hydrate intensément",
      category: "CONDITIONER",
      status: "ACTIVE",
      price: 9000,
      compareAtPrice: 12000,
      cost: 5400,
      stockQuantity: 50,
      weight: 400,
      volume: 400,
      featuredImage:
        "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800",
      featured: false,
    },

    // Treatments
    {
      sku: "TRE-MASK-U1V2",
      name: "Masque Réparateur Protéiné",
      slug: "masque-reparateur-proteine",
      description:
        "Masque intensif aux protéines de soie et de blé. Répare les cheveux très abîmés, restaure élasticité et force. Traitement hebdomadaire recommandé pour cheveux fragilisés par les colorations ou lissages.",
      shortDescription: "Répare les cheveux très abîmés",
      category: "TREATMENT",
      status: "ACTIVE",
      price: 13500,
      compareAtPrice: 18000,
      cost: 8000,
      stockQuantity: 30,
      weight: 250,
      volume: 250,
      featuredImage:
        "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800",
      featured: true,
    },
  ];

  const createdProducts = await Promise.all(
    products.map((product) =>
      prisma.product.create({
        data: product,
      }),
    ),
  );

  console.log(`✅ Created ${createdProducts.length} products`);

  // Create Product Images
  const productImages = [];
  for (const product of createdProducts) {
    const images = [
      {
        productId: product.id,
        url: product.featuredImage,
        altText: `${product.name} - Image 1`,
        position: 0,
      },
      {
        productId: product.id,
        url: product.featuredImage.replace("?w=800", "?w=800&h=800&fit=crop"),
        altText: `${product.name} - Image 2`,
        position: 1,
      },
    ];
    productImages.push(...images);
  }

  await prisma.productImage.createMany({
    data: productImages,
  });

  console.log("✅ Created product images");

  // Create Discount Codes
  const discountCodes = await Promise.all([
    prisma.discountCode.create({
      data: {
        code: "WELCOME10",
        description: "Remise de bienvenue 10%",
        type: "PERCENTAGE",
        value: 10,
        maxUses: 100,
        maxUsesPerUser: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isActive: true,
      },
    }),
    prisma.discountCode.create({
      data: {
        code: "PROMO5000",
        description: "Réduction de 5000 XAF",
        type: "FIXED_AMOUNT",
        value: 5000,
        minPurchaseAmount: 30000,
        maxUses: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      },
    }),
    prisma.discountCode.create({
      data: {
        code: "VIP20",
        description: "Code VIP 20%",
        type: "PERCENTAGE",
        value: 20,
        minPurchaseAmount: 50000,
        maxUses: 20,
        maxUsesPerUser: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
      },
    }),
  ]);

  console.log("✅ Created discount codes");

  // Create Sample Reviews
  const reviews = [
    {
      userId: customers[0].id,
      productId: createdProducts[0].id,
      rating: 5,
      title: "Excellent produit!",
      comment:
        "J'adore cette huile de coco! Mes cheveux sont beaucoup plus doux et brillants. Je recommande vivement!",
      isVerified: true,
      isApproved: true,
    },
    {
      userId: customers[1].id,
      productId: createdProducts[0].id,
      rating: 4,
      title: "Très bon",
      comment:
        "Bon produit, hydrate bien les cheveux. Petit bémol sur le packaging.",
      isVerified: true,
      isApproved: true,
    },
    {
      userId: customers[0].id,
      productId: createdProducts[5].id,
      rating: 5,
      title: "Résultats visibles!",
      comment:
        "Après 3 semaines, je vois déjà des baby hairs! Le sérum est vraiment efficace.",
      isVerified: true,
      isApproved: true,
    },
  ];

  await prisma.review.createMany({
    data: reviews,
  });

  console.log("✅ Created reviews");

  // Create System Settings
  await prisma.systemSettings.createMany({
    data: [
      {
        key: "DELIVERY_FEE",
        value: "2000",
        description: "Frais de livraison standard",
      },
      {
        key: "ADMIN_EMAIL",
        value: "admin@princesse-sultana.cm",
        description: "Email administrateur",
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
  console.log("─────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
