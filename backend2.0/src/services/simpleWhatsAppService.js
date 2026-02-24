const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  DisconnectReason,
  useMultiFileAuthState,
  makeInMemoryStore,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");

/**
 * Simple WhatsApp Service using Baileys
 * No third-party dependencies like Twilio
 * Uses official WhatsApp Web API
 */
class SimpleWhatsAppService {
  constructor() {
    this.sock = null;
    this.isConnected = false;
    this.qrCode = null;
    this.adminPhone = process.env.ADMIN_WHATSAPP_NUMBER; // Your WhatsApp number
    this.authFolder = path.join(__dirname, "../whatsapp-auth");
  }

  /**
   * Initialize WhatsApp connection
   */
  async initialize() {
    try {
      // Use file-based auth state for persistence
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

      // Create socket connection
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // This will print QR code in terminal
        logger: pino({ level: "silent" }), // Disable logs
        browser: ["Princesse Sultana Hair Care", "Chrome", "1.0.0"],
      });

      // Handle connection updates
      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          console.log("\n📱 Scan this QR code with WhatsApp:");
          console.log(qr);
        }

        if (connection === "close") {
          const shouldReconnect =
            lastDisconnect?.error?.output?.statusCode !==
            DisconnectReason.loggedOut;

          console.log(
            "WhatsApp connection closed due to",
            lastDisconnect?.error,
            ", reconnecting:",
            shouldReconnect,
          );

          if (shouldReconnect) {
            await this.initialize();
          }
        } else if (connection === "open") {
          this.isConnected = true;
          console.log("✅ WhatsApp connected successfully!");
        }
      });

      // Save credentials when updated
      this.sock.ev.on("creds.update", saveCreds);

      return this.sock;
    } catch (error) {
      console.error("Failed to initialize WhatsApp:", error);
      throw error;
    }
  }

  /**
   * Format phone number to WhatsApp format
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number with @s.whatsapp.net
   */
  formatWhatsAppNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // If starts with 0, replace with country code (Cameroon +237)
    if (cleaned.startsWith("0")) {
      cleaned = "237" + cleaned.substring(1);
    }

    // If doesn't start with 237, add it
    if (!cleaned.startsWith("237")) {
      cleaned = "237" + cleaned;
    }

    return cleaned + "@s.whatsapp.net";
  }

  /**
   * Send WhatsApp message
   * @param {string} to - Phone number
   * @param {string} message - Message text
   * @returns {Promise<Object>} Result
   */
  async sendMessage(to, message) {
    try {
      if (!this.isConnected || !this.sock) {
        console.warn("WhatsApp not connected. Attempting to connect...");
        await this.initialize();

        // Wait a bit for connection
        await new Promise((resolve) => setTimeout(resolve, 3000));

        if (!this.isConnected) {
          return {
            success: false,
            error: "WhatsApp not connected. Please scan QR code.",
          };
        }
      }

      const formattedNumber = this.formatWhatsAppNumber(to);

      await this.sock.sendMessage(formattedNumber, { text: message });

      console.log(`✅ WhatsApp message sent to ${to}`);
      return { success: true, to: formattedNumber };
    } catch (error) {
      console.error("Failed to send WhatsApp message:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order confirmation to customer
   */
  async sendOrderConfirmation(order) {
    const {
      user,
      orderNumber,
      items,
      total,
      subtotal,
      deliveryFee,
      discount,
      address,
    } = order;

    const itemsList = items
      .map((item) => `• ${item.productName} x${item.quantity}`)
      .join("\n");

    const message = `
🎉 *Commande Confirmée!*

Bonjour ${user.firstName},

Merci pour votre commande! Nous avons bien reçu votre commande *#${orderNumber}*.

📦 *Vos articles:*
${itemsList}

💰 *Résumé:*
Sous-total: ${this.formatCurrency(subtotal)}
Livraison: ${this.formatCurrency(deliveryFee)}
${discount > 0 ? `Réduction: -${this.formatCurrency(discount)}\n` : ""}*Total: ${this.formatCurrency(total)}*

🚚 *Adresse de livraison:*
${address.fullName}
${address.street}
${address.city}, ${address.region}
Tel: ${address.phone}

Nous préparons votre commande avec soin et vous tiendrons informé(e) de chaque étape.

Merci de votre confiance! 🙏

_Pricesse Sultana Hair Care - Vos cheveux, notre passion_ 💚
    `.trim();

    return await this.sendMessage(user.phone, message);
  }

  /**
   * Send order notification to admin
   */
  async sendAdminOrderNotification(order) {
    if (!this.adminPhone) {
      console.warn("Admin WhatsApp number not configured");
      return { success: false, error: "Admin number not configured" };
    }

    const { user, orderNumber, items, total, address, paymentMethod } = order;

    const itemsList = items
      .map(
        (item) =>
          `• ${item.productName} x${item.quantity} - ${this.formatCurrency(item.subtotal)}`,
      )
      .join("\n");

    const message = `
🔔 *NOUVELLE COMMANDE!*

Commande: *#${orderNumber}*

👤 *Client:*
${user.firstName} ${user.lastName}
Tel: ${user.phone}
Email: ${user.email}

📦 *Articles:*
${itemsList}

💰 *Total: ${this.formatCurrency(total)}*

🚚 *Livraison:*
${address.fullName}
${address.street}
${address.city}, ${address.region}
${address.landmark || ""}
Tel: ${address.phone}

💳 *Paiement:* ${paymentMethod === "CASH_ON_DELIVERY" ? "À la livraison" : paymentMethod}

${order.customerNotes ? `📝 *Notes:* ${order.customerNotes}` : ""}

⚡ Connectez-vous au dashboard pour traiter cette commande.
    `.trim();

    return await this.sendMessage(this.adminPhone, message);
  }

  /**
   * Format currency helper
   */
  formatCurrency(amount) {
    return (
      new Intl.NumberFormat("fr-FR", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + " FCFA"
    );
  }

  /**
   * Disconnect WhatsApp
   */
  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.isConnected = false;
      console.log("WhatsApp disconnected");
    }
  }

  /**
   * Get QR Code for scanning
   */
  getQRCode() {
    return this.qrCode;
  }

  /**
   * Check if connected
   */
  checkConnection() {
    return this.isConnected;
  }
}

module.exports = new SimpleWhatsAppService();
