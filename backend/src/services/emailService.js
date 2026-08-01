const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");
const handlebars = require("handlebars");

/**
 * EmailService
 * Handles all email sending functionality using Nodemailer
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    // For Gmail
    if (process.env.EMAIL_SERVICE === "gmail") {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD, // Use App Password if 2FA is enabled
        },
      });
    }
    // For SMTP (e.g., SendGrid, Mailgun, custom SMTP)
    else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }

  /**
   * Load and compile email template
   */
  async getTemplate(templateName, context) {
    try {
      const templatePath = path.join(
        __dirname,
        "../templates/emails",
        `${templateName}.html`
      );
      const templateContent = await fs.readFile(templatePath, "utf-8");
      const template = handlebars.compile(templateContent);
      return template(context);
    } catch (error) {
      console.error(`Failed to load template ${templateName}:`, error);
      // Fallback to plain text
      return this.getPlainTextFallback(templateName, context);
    }
  }

  /**
   * Plain text fallback when template is not found
   */
  getPlainTextFallback(templateName, context) {
    switch (templateName) {
      case "orderConfirmation":
        return `
Bonjour ${context.customerName},

Votre commande #${context.orderNumber} a été confirmée!

Détails de la commande:
${context.items.map((item) => `- ${item.name} x ${item.quantity}: ${item.subtotal}`).join("\n")}

Sous-total: ${context.subtotal}
Livraison: ${context.deliveryFee}
${context.discount > 0 ? `Réduction: -${context.discount}` : ""}
Total: ${context.total}

Adresse de livraison:
${context.shippingAddress}

Mode de paiement: ${context.paymentMethod}

Merci de votre confiance!
        `.trim();

      case "orderStatusUpdate":
        return `
Bonjour ${context.customerName},

Mise à jour de votre commande #${context.orderNumber}:

Statut: ${context.status} ${context.emoji}

Consultez votre compte pour plus de détails.
        `.trim();

      case "deliveryAssignment":
        return `
Bonjour ${context.deliveryPersonName},

Nouvelle livraison assignée: #${context.orderNumber}

Articles:
${context.items.map((item) => `- ${item.name} x ${item.quantity}`).join("\n")}

Adresse de livraison:
${context.deliveryAddress}

Contact client:
Nom: ${context.customerName}
Téléphone: ${context.customerPhone}

Montant total: ${context.total}

Bonne livraison!
        `.trim();

      case "deliveryConfirmation":
        return `
Bonjour ${context.customerName},

Votre commande #${context.orderNumber} a été livrée avec succès!

Montant: ${context.total}
Date de livraison: ${context.deliveryDate}

Merci pour votre achat!
        `.trim();

      case "orderCancellation":
        return `
Bonjour ${context.customerName},

Votre commande #${context.orderNumber} a été annulée.

${context.reason ? `Raison: ${context.reason}` : ""}
Montant: ${context.total}

Pour toute question, n'hésitez pas à nous contacter.
        `.trim();

      default:
        return "Notification de commande";
    }
  }

  /**
   * Send email
   */
  async sendEmail({ to, subject, template, context, html, text, attachments }) {
    try {
      if (!this.transporter) {
        console.error("Email transporter not initialized");
        return { success: false, error: "Email service not configured" };
      }

      let htmlContent = html;
      let textContent = text;

      // If template is provided, load and compile it
      if (template) {
        htmlContent = await this.getTemplate(template, context);
        textContent = this.getPlainTextFallback(template, context);
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || "Hair Haven",
          address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
        },
        to,
        subject,
        html: htmlContent,
        text: textContent,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log("Email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails) {
    const results = await Promise.allSettled(
      emails.map((emailData) => this.sendEmail(emailData))
    );

    return results.map((result, index) => ({
      email: emails[index].to,
      success: result.status === "fulfilled" && result.value.success,
      error: result.status === "rejected" ? result.reason : result.value?.error,
    }));
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    try {
      if (!this.transporter) {
        throw new Error("Email transporter not initialized");
      }

      await this.transporter.verify();
      console.log("✅ Email service ready");
      return true;
    } catch (error) {
      console.error("❌ Email service verification failed:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
