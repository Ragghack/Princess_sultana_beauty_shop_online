/**
 * fixBundles.js — One-time migration script
 * 
 * Same root cause as fixProducts.js:
 * MongoDB stores "deletedAt: undefined" (field missing) instead of null.
 * Prisma's WHERE deletedAt = null never matches → bundles invisible.
 * 
 * Run ONCE: node fixBundles.js
 * Delete after use.
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

async function fixBundles() {
  console.log("🔍 Scanning bundles collection...\n");

  // Get ALL bundles regardless of deletedAt
  const allBundles = await prisma.bundle.findMany({
    select: { id: true, name: true, status: true, deletedAt: true },
  });

  console.log(`Total bundles in DB: ${allBundles.length}`);

  // Find bundles with missing deletedAt (stored as undefined/missing in MongoDB)
  const broken = allBundles.filter((b) => b.deletedAt === undefined || b.deletedAt === null);
  const trulyDeleted = allBundles.filter((b) => b.deletedAt instanceof Date);

  console.log(`  ✅ Already properly stored: ${trulyDeleted.length}`);
  console.log(`  ❌ Missing deletedAt field : ${broken.length}`);

  if (broken.length === 0) {
    console.log("\n✅ Nothing to fix — all bundles already have deletedAt stored correctly.");
    return;
  }

  console.log("\n🔧 Patching bundles...");
  let patched = 0;
  for (const bundle of broken) {
    await prisma.bundle.update({
      where: { id: bundle.id },
      data: { deletedAt: null, status: "ACTIVE" },
    });
    console.log(`  ✅ Patched: "${bundle.name}" (${bundle.id})`);
    patched++;
  }

  console.log(`\n✅ Done — patched ${patched} bundle(s).`);
  console.log("🚀 Bundles should now be visible in the API.");
  console.log("📌 Delete this file after confirming bundles appear correctly.\n");
}

fixBundles()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());