const twilio = require("twilio");
const axios = require("axios");

/**
 * WhatsAppService
 * Handles WhatsApp message sending
 * 
 * Options:
 * 1. Twilio WhatsApp API (recommended for production)
 * 2. WhatsApp Business API
 * 3. Baileys (unofficial, for development)
 */
class WhatsAppService {
  constructor() {
    this.client = null;
    this.provider = process.env.WHATSAPP_PROVIDER || "twilio"; // twilio, business-api, baileys
    this.initializeClient();
  }

  /**
   * Initialize WhatsApp client based on provider
   */
  initializeClient() {
    if (this.provider === "twilio") {
      this.initializeTwilio();
    } else if (this.provider === "business-api") {
      this.initializeBusinessAPI();
    }
    // Add other providers as needed
  }

  /**
   * Initialize Twilio WhatsApp
   */
  initializeTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., whatsapp:+14155238886

    if (accountSid && authToken && this.fromWhatsApp) {
      this.client = twilio(accountSid, authToken);
      console.log("✅ WhatsApp Service (Twilio) initialized");
    } else {
      console.warn("⚠️ WhatsApp Service not configured - Set TWILIO credentials");
    }
  }

  /**
   * Initialize WhatsApp Business API
   */
  initializeBusinessAPI() {
    this.businessApiUrl = process.env.WHATSAPP_BUSINESS_API_URL;
    this.businessApiToken = process.env.WHATSAPP_BUSINESS_API_TOKEN;
    this.businessPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (this.businessApiUrl && this.businessApiToken) {
      console.log("✅ WhatsApp Service (Business API) initialized");
    } else {
      console.warn("⚠️ WhatsApp Business API not configured");
    }
  }

  /**
   * Format phone number for WhatsApp
   */
  formatWhatsAppNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // If it starts with 0, replace with country code (Cameroon +237)
    if (cleaned.startsWith("0")) {
      cleaned = "237" + cleaned.substring(1);
    }

    // For Twilio, format as whatsapp:+number
    if (this.provider === "twilio") {
      if (!cleaned.startsWith("+")) {
        cleaned = "+" + cleaned;
      }
      return `whatsapp:${cleaned}`;
    }

    // For Business API, just return the number with +
    return cleaned.startsWith("+") ? cleaned : "+" + cleaned;
  }

  /**
   * Send WhatsApp message via Twilio
   */
  async sendViaTwilio(to, message) {
    try {
      if (!this.client) {
        console.warn("WhatsApp service not configured");
        return { success: false, error: "WhatsApp service not configured" };
      }

      const formattedNumber = this.formatWhatsAppNumber(to);

      const result = await this.client.messages.create({
        body: message,
        from: this.fromWhatsApp,
        to: formattedNumber,
      });

      console.log("WhatsApp message sent:", result.sid);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error("WhatsApp sending failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp message via Business API
   */
  async sendViaBusinessAPI(to, message) {
    try {
      if (!this.businessApiUrl || !this.businessApiToken) {
        return { success: false, error: "Business API not configured" };
      }

      const formattedNumber = this.formatWhatsAppNumber(to);

      const response = await axios.post(
        `${this.businessApiUrl}/${this.businessPhoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: formattedNumber.replace("+", ""),
          type: "text",
          text: {
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.businessApiToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("WhatsApp message sent:", response.data);
      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error("WhatsApp Business API failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp message (auto-detects provider)
   */
  async sendMessage(to, message) {
    if (this.provider === "twilio") {
      return this.sendViaTwilio(to, message);
    } else if (this.provider === "business-api") {
      return this.sendViaBusinessAPI(to, message);
    } else {
      console.warn("No WhatsApp provider configured");
      return { success: false, error: "No provider configured" };
    }
  }

  /**
   * Send WhatsApp message with template (Business API only)
   */
  async sendTemplate(to, templateName, components) {
    try {
      if (this.provider !== "business-api") {
        throw new Error("Templates only supported with Business API");
      }

      const formattedNumber = this.formatWhatsAppNumber(to);

      const response = await axios.post(
        `${this.businessApiUrl}/${this.businessPhoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: formattedNumber.replace("+", ""),
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "fr", // French
            },
            components: components,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.businessApiToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error("WhatsApp template sending failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk WhatsApp messages
   */
  async sendBulkMessages(messages) {
    const results = await Promise.allSettled(
      messages.map(({ to, message }) => this.sendMessage(to, message))
    );

    return results.map((result, index) => ({
      phone: messages[index].to,
      success: result.status === "fulfilled" && result.value.success,
      error: result.status === "rejected" ? result.reason : result.value?.error,
    }));
  }

  /**
   * Verify WhatsApp configuration
   */
  async verifyConfiguration() {
    if (this.provider === "twilio" && this.client) {
      try {
        const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        console.log("✅ WhatsApp Service (Twilio) verified");
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else if (this.provider === "business-api" && this.businessApiUrl) {
      console.log("✅ WhatsApp Business API configured");
      return { success: true };
    }

    return { success: false, error: "WhatsApp not configured" };
  }
}

module.exports = new WhatsAppService();
