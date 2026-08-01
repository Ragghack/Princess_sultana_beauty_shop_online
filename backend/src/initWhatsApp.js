/**
 * WhatsApp Initialization Script
 * Run this once to connect your WhatsApp account
 *
 * Usage: node initWhatsApp.js
 */

require("dotenv").config();
const WhatsAppService = require("./services/simpleWhatsAppService");

async function initializeWhatsApp() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  WhatsApp Connection Initialization    ║");
  console.log("╚════════════════════════════════════════╝\n");

  console.log("📱 Starting WhatsApp connection...\n");
  console.log("⏳ Please wait for QR code to appear...\n");

  try {
    await WhatsAppService.initialize();

    console.log("\n📋 Instructions:");
    console.log("1. Open WhatsApp on your phone");
    console.log("2. Go to Settings → Linked Devices");
    console.log("3. Tap 'Link a Device'");
    console.log("4. Scan the QR code above\n");

    // Keep the process alive
    console.log("✅ Waiting for QR code scan...");
    console.log("   (This window will stay open)\n");

    // Check connection status every 5 seconds
    const checkInterval = setInterval(() => {
      if (WhatsAppService.checkConnection()) {
        console.log("\n🎉 WhatsApp connected successfully!");
        console.log("✅ You can now close this window.");
        console.log("✅ Your WhatsApp will stay connected for future use.\n");
        clearInterval(checkInterval);
      }
    }, 5000);
  } catch (error) {
    console.error("\n❌ Failed to initialize WhatsApp:", error.message);
    console.log("\nTroubleshooting:");
    console.log("1. Make sure you have internet connection");
    console.log("2. Check if port is not blocked by firewall");
    console.log("3. Try restarting the script\n");
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", async () => {
  console.log("\n\n👋 Disconnecting WhatsApp...");
  await WhatsAppService.disconnect();
  process.exit(0);
});

initializeWhatsApp();
