/**
 * Telegram Bot Integration
 * 
 * Setup:
 * 1. Create a bot via @BotFather on Telegram
 * 2. Add TELEGRAM_BOT_TOKEN to .env.local
 * 3. Users store their Telegram chat_id or username in their profile
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_SELLER_CHAT_ID = process.env.TELEGRAM_SELLER_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Send a text message via Telegram Bot API
 */
export async function sendTelegramMessage(
  chatId: string,
  message: string,
  parseMode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'HTML'
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram bot token not configured, skipping notification');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API error:', data.description);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

/**
 * Send an order notification to the seller
 */
export async function notifySellerOfOrder(order: {
  orderNumber: string;
  itemName: string;
  itemCategory: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  buyerName: string;
  buyerEmail: string;
  message?: string;
  itemSize?: string;
  itemColor?: string;
}): Promise<boolean> {
  const sellerChatId = TELEGRAM_SELLER_CHAT_ID;
  if (!sellerChatId) {
    console.warn('TELEGRAM_SELLER_CHAT_ID / TELEGRAM_CHAT_ID not set, skipping seller notification');
    return false;
  }

  const variants = [
    order.itemSize ? `Size: ${order.itemSize}` : '',
    order.itemColor ? `Color: ${order.itemColor}` : '',
  ].filter(Boolean).join(' | ');

  const msg = [
    `🛒 <b>New Order Received!</b>`,
    ``,
    `<b>Order:</b> #${order.orderNumber}`,
    `<b>Date:</b> ${new Date().toLocaleString()}`,
    ``,
    `<b>Item:</b> ${order.itemName}`,
    `<b>Category:</b> ${order.itemCategory}`,
    variants ? `<b>Variants:</b> ${variants}` : '',
    `<b>Qty:</b> ${order.quantity}`,
    `<b>Unit Price:</b> Br ${order.unitPrice.toFixed(2)}`,
    `<b>Total:</b> <b>Br ${order.totalPrice.toFixed(2)}</b>`,
    ``,
    `<b>Buyer:</b> ${order.buyerName}`,
    `<b>Email:</b> ${order.buyerEmail}`,
    order.message ? `\n<b>Message:</b> ${order.message}` : '',
    ``,
    `⚡ Log in to your dashboard to approve or decline this order.`,
  ].filter(Boolean).join('\n');

  return sendTelegramMessage(sellerChatId, msg);
}

/**
 * Send order status update notification to buyer
 */
export async function notifyBuyerOfStatus(
  buyerChatId: string,
  orderNumber: string,
  status: 'APPROVED' | 'DECLINED',
  sellerContact: {
    phone?: string;
    whatsapp?: string;
    telegram?: string;
    instagram?: string;
    shopName?: string;
  }
): Promise<boolean> {
  const statusEmoji = status === 'APPROVED' ? '✅' : '❌';
  const contactLines = [
    sellerContact.phone ? `📞 Phone: ${sellerContact.phone}` : '',
    sellerContact.whatsapp ? `💬 WhatsApp: ${sellerContact.whatsapp}` : '',
    sellerContact.telegram ? `✈️ Telegram: ${sellerContact.telegram}` : '',
    sellerContact.instagram ? `📷 Instagram: ${sellerContact.instagram}` : '',
  ].filter(Boolean);

  const msg = [
    `${statusEmoji} <b>Order #${orderNumber} ${status}</b>`,
    ``,
    status === 'APPROVED'
      ? `Great news! Your order has been approved by ${sellerContact.shopName || 'the seller'}.`
      : `Unfortunately, your order has been declined.`,
    ``,
    status === 'APPROVED' ? `<b>Contact the seller to arrange payment & delivery:</b>` : '',
    ...contactLines,
    ``,
    status === 'APPROVED' ? `💡 Payment, delivery, and other details will be arranged through direct contact.` : '',
  ].filter(Boolean).join('\n');

  return sendTelegramMessage(buyerChatId, msg);
}

/**
 * Get bot info to verify the bot is configured correctly
 */
export async function getBotInfo(): Promise<{ username?: string; first_name?: string } | null> {
  if (!TELEGRAM_BOT_TOKEN) return null;

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/getMe`);
    const data = await response.json();
    return data.ok ? data.result : null;
  } catch {
    return null;
  }
}
