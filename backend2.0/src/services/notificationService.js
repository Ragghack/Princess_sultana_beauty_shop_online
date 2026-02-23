const EmailService = require("./emailService");
const SMSService = require("./smsService");
const WhatsAppService = require("./whatsappService");
const { formatCurrency, formatDate } = require("../utils/formatters");

/**
 * NotificationService
 * Handles all order-related notifications via Email, SMS, and WhatsApp
 */
class NotificationService {
  /**
   * Send order confirmation to customer
   */
  static async sendOrderConfirmation(order) {
    const {
      user,
      orderNumber,
      items,
      total,
      subtotal,
      deliveryFee,
      discount,
      address,
      paymentMethod,
    } = order;

    // Prepare items list for email
    const itemsList = items
      .map(
        (item) =>
          `- ${item.productName} x ${item.quantity} = ${formatCurrency(item.subtotal)}`
      )
      .join("\n");

    // Email notification
    const emailData = {
      to: user.email,
      subject: `Confirmation de commande #${orderNumber}`,
      template: "orderConfirmation",
      context: {
        customerName: `${user.firstName} ${user.lastName}`,
        orderNumber,
        items: items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          price: formatCurrency(item.price),
          subtotal: formatCurrency(item.subtotal),
          image: item.productImage,
        })),
        subtotal: formatCurrency(subtotal),
        deliveryFee: formatCurrency(deliveryFee),
        discount: formatCurrency(discount),
        total: formatCurrency(total),
        shippingAddress: `${address.street}, ${address.city}, ${address.region}`,
        paymentMethod:
          paymentMethod === "CASH_ON_DELIVERY"
            ? "Paiement à la livraison"
            : paymentMethod,
        orderDate: formatDate(order.createdAt),
      },
    };

    // SMS notification
    const smsMessage = `Bonjour ${user.firstName}, votre commande #${orderNumber} a été confirmée! Montant: ${formatCurrency(total)}. Nous vous tiendrons informé de son statut. Merci!`;

    // WhatsApp notification (more detailed)
    const whatsappMessage = `
🎉 *Commande Confirmée!*

Bonjour ${user.firstName} ${user.lastName},

Votre commande #${orderNumber} a été reçue avec succès.

📦 *Détails de la commande:*
${itemsList}

💰 *Résumé:*
Sous-total: ${formatCurrency(subtotal)}
Livraison: ${formatCurrency(deliveryFee)}
${discount > 0 ? `Réduction: -${formatCurrency(discount)}` : ""}
*Total: ${formatCurrency(total)}*

🚚 *Adresse de livraison:*
${address.fullName}
${address.street}
${address.city}, ${address.region}
${address.phone}

💳 *Paiement:* ${paymentMethod === "CASH_ON_DELIVERY" ? "À la livraison" : paymentMethod}

Nous vous tiendrons informé de l'évolution de votre commande.

Merci de votre confiance! 🙏
    `.trim();

    // Send notifications in parallel
    const notifications = [];

    // Email
    notifications.push(
      EmailService.sendEmail(emailData).catch((error) => {
        console.error("Email notification failed:", error);
      })
    );

    // SMS
    if (user.phone) {
      notifications.push(
        SMSService.sendSMS(user.phone, smsMessage).catch((error) => {
          console.error("SMS notification failed:", error);
        })
      );
    }

    // WhatsApp
    if (user.phone) {
      notifications.push(
        WhatsAppService.sendMessage(user.phone, whatsappMessage).catch(
          (error) => {
            console.error("WhatsApp notification failed:", error);
          }
        )
      );
    }

    await Promise.allSettled(notifications);
  }

  /**
   * Send order status update to customer
   */
  static async sendOrderStatusUpdate(order, newStatus) {
    const { user, orderNumber } = order;

    const statusMessages = {
      PENDING: "en attente",
      CONFIRMED: "confirmée",
      PROCESSING: "en cours de préparation",
      ASSIGNED: "assignée à un livreur",
      SHIPPED: "expédiée",
      OUT_FOR_DELIVERY: "en cours de livraison",
      DELIVERED: "livrée",
      CANCELLED: "annulée",
    };

    const statusEmojis = {
      PENDING: "⏳",
      CONFIRMED: "✅",
      PROCESSING: "📦",
      ASSIGNED: "🚚",
      SHIPPED: "🚀",
      OUT_FOR_DELIVERY: "🛵",
      DELIVERED: "✅",
      CANCELLED: "❌",
    };

    const statusText = statusMessages[newStatus] || newStatus;
    const emoji = statusEmojis[newStatus] || "📢";

    // Email
    const emailData = {
      to: user.email,
      subject: `Mise à jour de votre commande #${orderNumber}`,
      template: "orderStatusUpdate",
      context: {
        customerName: `${user.firstName} ${user.lastName}`,
        orderNumber,
        status: statusText,
        emoji,
        orderDate: formatDate(order.createdAt),
      },
    };

    // SMS
    const smsMessage = `${emoji} Commande #${orderNumber}: Votre commande est ${statusText}. Consultez votre compte pour plus de détails.`;

    // WhatsApp
    const whatsappMessage = `
${emoji} *Mise à jour de commande*

Bonjour ${user.firstName},

Votre commande #${orderNumber} est maintenant *${statusText}*.

${newStatus === "DELIVERED" ? "🎉 Merci pour votre achat! N'hésitez pas à nous laisser un avis." : ""}
${newStatus === "CANCELLED" ? "Si vous avez des questions, n'hésitez pas à nous contacter." : ""}

Consultez votre compte pour plus de détails.
    `.trim();

    // Send notifications
    const notifications = [
      EmailService.sendEmail(emailData).catch(console.error),
    ];

    if (user.phone) {
      notifications.push(SMSService.sendSMS(user.phone, smsMessage).catch(console.error));
      notifications.push(
        WhatsAppService.sendMessage(user.phone, whatsappMessage).catch(console.error)
      );
    }

    await Promise.allSettled(notifications);
  }

  /**
   * Send delivery assignment notification
   */
  static async sendDeliveryAssignment(order) {
    const { deliveryPersonnel, orderNumber, address, items, total } = order;

    const itemsList = items
      .map((item) => `- ${item.productName} x ${item.quantity}`)
      .join("\n");

    // Email to delivery personnel
    const emailData = {
      to: deliveryPersonnel.email,
      subject: `Nouvelle livraison assignée - #${orderNumber}`,
      template: "deliveryAssignment",
      context: {
        deliveryPersonName: `${deliveryPersonnel.firstName} ${deliveryPersonnel.lastName}`,
        orderNumber,
        items: items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
        })),
        deliveryAddress: `${address.street}, ${address.city}, ${address.region}`,
        customerName: address.fullName,
        customerPhone: address.phone,
        total: formatCurrency(total),
      },
    };

    // SMS to delivery personnel
    const smsMessage = `Nouvelle livraison #${orderNumber}. Adresse: ${address.street}, ${address.city}. Contact: ${address.phone}`;

    // WhatsApp to delivery personnel
    const whatsappMessage = `
🚚 *Nouvelle Livraison Assignée*

Bonjour ${deliveryPersonnel.firstName},

Commande: #${orderNumber}

📦 *Articles:*
${itemsList}

📍 *Adresse de livraison:*
${address.fullName}
${address.street}
${address.city}, ${address.region}
${address.landmark || ""}

📞 *Contact client:*
${address.phone}

💰 *Montant total:* ${formatCurrency(total)}

Bonne livraison! 🚀
    `.trim();

    // Send notifications
    const notifications = [
      EmailService.sendEmail(emailData).catch(console.error),
    ];

    if (deliveryPersonnel.phone) {
      notifications.push(
        SMSService.sendSMS(deliveryPersonnel.phone, smsMessage).catch(console.error)
      );
      notifications.push(
        WhatsAppService.sendMessage(deliveryPersonnel.phone, whatsappMessage).catch(
          console.error
        )
      );
    }

    await Promise.allSettled(notifications);

    // Also notify customer that delivery is assigned
    if (order.user) {
      const customerMessage = `Bonne nouvelle! Votre commande #${orderNumber} a été assignée à un livreur. Vous serez livré bientôt! 🚚`;

      if (order.user.phone) {
        await WhatsAppService.sendMessage(order.user.phone, customerMessage).catch(
          console.error
        );
      }
    }
  }

  /**
   * Send delivery confirmation
   */
  static async sendDeliveryConfirmation(order) {
    const { user, orderNumber, total } = order;

    // Email
    const emailData = {
      to: user.email,
      subject: `Commande livrée - #${orderNumber}`,
      template: "deliveryConfirmation",
      context: {
        customerName: `${user.firstName} ${user.lastName}`,
        orderNumber,
        total: formatCurrency(total),
        deliveryDate: formatDate(order.deliveredAt),
      },
    };

    // SMS
    const smsMessage = `🎉 Votre commande #${orderNumber} a été livrée! Merci pour votre achat. N'hésitez pas à nous laisser un avis.`;

    // WhatsApp
    const whatsappMessage = `
🎉 *Commande Livrée!*

Bonjour ${user.firstName},

Votre commande #${orderNumber} a été livrée avec succès!

💰 *Montant:* ${formatCurrency(total)}
📅 *Livré le:* ${formatDate(order.deliveredAt)}

Merci pour votre confiance! 🙏

Nous espérons que vous êtes satisfait(e) de vos produits. N'hésitez pas à nous laisser un avis sur votre expérience.

À très bientôt! 💚
    `.trim();

    // Send notifications
    const notifications = [
      EmailService.sendEmail(emailData).catch(console.error),
    ];

    if (user.phone) {
      notifications.push(SMSService.sendSMS(user.phone, smsMessage).catch(console.error));
      notifications.push(
        WhatsAppService.sendMessage(user.phone, whatsappMessage).catch(console.error)
      );
    }

    await Promise.allSettled(notifications);
  }

  /**
   * Send order cancellation notification
   */
  static async sendOrderCancellation(order, reason) {
    const { user, orderNumber, total } = order;

    // Email
    const emailData = {
      to: user.email,
      subject: `Commande annulée - #${orderNumber}`,
      template: "orderCancellation",
      context: {
        customerName: `${user.firstName} ${user.lastName}`,
        orderNumber,
        total: formatCurrency(total),
        reason: reason || "Annulation demandée",
        cancelDate: formatDate(order.cancelledAt),
      },
    };

    // SMS
    const smsMessage = `Votre commande #${orderNumber} a été annulée. ${reason ? `Raison: ${reason}` : ""} Pour toute question, contactez-nous.`;

    // WhatsApp
    const whatsappMessage = `
❌ *Commande Annulée*

Bonjour ${user.firstName},

Votre commande #${orderNumber} a été annulée.

${reason ? `📝 *Raison:* ${reason}` : ""}

💰 *Montant:* ${formatCurrency(total)}

${order.paymentStatus === "COMPLETED" ? "Le remboursement sera traité dans 5-7 jours ouvrables." : ""}

Si vous avez des questions ou souhaitez passer une nouvelle commande, n'hésitez pas à nous contacter.

Merci de votre compréhension.
    `.trim();

    // Send notifications
    const notifications = [
      EmailService.sendEmail(emailData).catch(console.error),
    ];

    if (user.phone) {
      notifications.push(SMSService.sendSMS(user.phone, smsMessage).catch(console.error));
      notifications.push(
        WhatsAppService.sendMessage(user.phone, whatsappMessage).catch(console.error)
      );
    }

    await Promise.allSettled(notifications);
  }

  /**
   * Send low stock alert to admin
   */
  static async sendLowStockAlert(product) {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) return;

    const emailData = {
      to: adminEmail,
      subject: `Alerte Stock Faible - ${product.name}`,
      template: "lowStockAlert",
      context: {
        productName: product.name,
        sku: product.sku,
        currentStock: product.stockQuantity,
        threshold: product.lowStockThreshold,
      },
    };

    await EmailService.sendEmail(emailData).catch(console.error);
  }
}

module.exports = NotificationService;
