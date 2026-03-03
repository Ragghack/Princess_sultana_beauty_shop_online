const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixAndCheck() {
  try {
    console.log("🔍 Step 1: ALL products with NO filters...\n");

    const all = await prisma.product.findMany({ where: {} });
    console.log(`📦 Total in DB: ${all.length}`);
    all.forEach((p) => {
      console.log(`  - "${p.name}" | status: ${p.status} | deletedAt: ${p.deletedAt}`);
    });

    console.log("\n🔧 Step 2: Fix invalid status...\n");
    const statusFix = await prisma.product.updateMany({
      where: {
        NOT: {
          status: { in: ["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DISCONTINUED"] },
        },
      },
      data: { status: "ACTIVE" },
    });
    console.log(`✅ Fixed ${statusFix.count} product(s) with invalid status`);

    console.log("\n🧪 Step 3: Simulate API query (where deletedAt: null)...\n");
    const apiResult = await prisma.product.findMany({
      where: { deletedAt: null },
    });
    console.log(`📦 Visible to API: ${apiResult.length}`);
    apiResult.forEach((p) => console.log(`  - "${p.name}" | status: ${p.status}`));

    if (apiResult.length === 0 && all.length > 0) {
      console.log("\n⚠️  PROBLEM: deletedAt is stored as missing field, not null.");
      console.log("   Patching each product individually...\n");

      for (const p of all) {
        await prisma.product.update({
          where: { id: p.id },
          data: { deletedAt: null },
        });
        console.log(`  ✅ Patched "${p.name}"`);
      }

      const verify = await prisma.product.findMany({ where: { deletedAt: null } });
      console.log(`\n✅ After patch — visible to API: ${verify.length}`);
      verify.forEach((p) => console.log(`  - "${p.name}"`));
    } else if (apiResult.length > 0) {
      console.log("\n✅ Products are visible to the API filter. No patch needed.");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAndCheck();