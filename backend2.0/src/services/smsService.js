const twilio = require("twilio");

/**
 * SMSService
 * Handles SMS sending using Twilio
 * Alternative providers: Africa's Talking, Nexmo, etc.
 */
class SMSService {
  constructor() {
    this.client = null;
    this.initializeClient();
  }

  /**
   * Initialize Twilio client
   */
  initializeClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      console.log("✅ SMS Service (Twilio) initialized");
    } else {
      console.warn("⚠️ SMS Service not configured - Set TWILIO credentials");
    }
  }

  /**
   * Format phone number to E.164 format
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // If it starts with 0, replace with country code (Cameroon +237)
    if (cleaned.startsWith("0")) {
      cleaned = "237" + cleaned.substring(1);
    }

    // Add + if not present
    if (!cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }

    return cleaned;
  }

  /**
   * Send SMS
   */
  async sendSMS(to, message) {
    try {
      if (!this.client) {
        console.warn("SMS service not configured, skipping SMS");
        return { success: false, error: "SMS service not configured" };
      }

      const formattedPhone = this.formatPhoneNumber(to);

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedPhone,
      });

      console.log("SMS sent:", result.sid);
      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error("SMS sending failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(messages) {
    const results = await Promise.allSettled(
      messages.map(({ to, message }) => this.sendSMS(to, message))
    );

    return results.map((result, index) => ({
      phone: messages[index].to,
      success: result.status === "fulfilled" && result.value.success,
      error: result.status === "rejected" ? result.reason : result.value?.error,
    }));
  }

  /**
   * Verify SMS configuration
   */
  async verifyConfiguration() {
    if (!this.client) {
      return { success: false, error: "SMS service not configured" };
    }

    try {
      // Verify account by fetching account details
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log("✅ SMS Service verified:", account.friendlyName);
      return { success: true };
    } catch (error) {
      console.error("❌ SMS Service verification failed:", error);
      return { success: false, error: error.message };
    }
  }
}

// ===============================================
// ALTERNATIVE: Africa's Talking Implementation
// ===============================================
/*
const AfricasTalking = require("africastalking");

class SMSService {
  constructor() {
    const options = {
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME,
    };
    
    this.client = AfricasTalking(options);
    this.sms = this.client.SMS;
  }

  async sendSMS(to, message) {
    try {
      const result = await this.sms.send({
        to: [to],
        message: message,
        from: process.env.AFRICASTALKING_SHORTCODE,
      });
      
      return { success: true, result };
    } catch (error) {
      console.error("SMS sending failed:", error);
      return { success: false, error: error.message };
    }
  }
}
*/

module.exports = new SMSService();
