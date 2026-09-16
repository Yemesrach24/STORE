import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const STORE_URL = process.env.TELEGRAM_STORE_URL || 'http://localhost:3000/shop';
const STORE_URL_BASE = STORE_URL.replace('/shop', '');

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: {
      id: number;
      first_name?: string;
      username?: string;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { chat: { id: number; first_name?: string } };
  };
}

// ---------- Message builders (per language) ----------

function getWelcomeMessage(lang: 'en' | 'am', firstName?: string): string {
  const name = firstName ? ` <b>${firstName}</b>` : '';
  if (lang === 'am') {
    return [
      `🥋 *እንኳን ወደ K-FORCE ETHIOPIA በደህና መጡ!*`,
      ``,
      `ሰላም${name}! ጥራት ያለው *የቴኳንዶ መሣሪያ* የሚያገኙበት ቦታ.`,
      ``,
      `*የምናቀርበው:*`,
      `• መከላከያ ፓድና ጋሻዎች`,
      `• ዶቦክ (ዩኒፎርም)`,
      `• የስፓሪንግ መሣሪያዎች`,
      `• የልምምድ ተጨማሪዎች`,
      `• ቀበቶና ተጨማሪዎች`,
      ``,
      `🛒 *መደብራችንን ይጎብኙ:*`,
      `[ወደ K-FORCE ETHIOPIA](${STORE_URL})`,
      ``,
      `/shop ይጻፉ ለማሰስ ወይም /about ለበለጠ መረጃ።`,
    ].join('\n');
  }
  return [
    `🥋 *Welcome to K-FORCE ETHIOPIA!*`,
    ``,
    `Hi${name}! We are your one-stop shop for premium *taekwondo equipment*.`,
    ``,
    `*What we offer:*`,
    `• Protective Pads & Guards`,
    `• Doboks (Uniforms)`,
    `• Sparring Gear`,
    `• Training Accessories`,
    `• Belts & Accessories`,
    ``,
    `🛒 *Browse our store:*`,
    `[Visit K-FORCE ETHIOPIA](${STORE_URL})`,
      ``,
    `Quality gear for every practitioner — from beginners to black belts! 💪`,
    ``,
    `Type /shop to browse, or /about to learn more about us.`,
  ].join('\n');
}

function getShopMessage(lang: 'en' | 'am'): string {
  if (lang === 'am') {
    return [
      `🥊 *K-FORCE ETHIOPIA — የቴኳንዶ መሣሪያዎች*`,
      ``,
      `ሙሉ የማሻሻያ መሣሪያዎቻችንን ይመልከቱ:`,
      `[ወደ K-FORCE ETHIOPIA](${STORE_URL})`,
      ``,
      `✅ ጥራት የተረጋገጠ`,
      `✅ ሰፊ ምርጫ`,
      `✅ በመላው ኢትዮጵያ ፈጣን አቅርቦት`,
    ].join('\n');
  }
  return [
    `🥊 *K-FORCE ETHIOPIA — Taekwondo Equipment*`,
    ``,
    `Browse our full catalog of martial arts gear:`,
    `[Visit K-FORCE ETHIOPIA](${STORE_URL})`,
    ``,
    `✅ Quality guaranteed`,
    `✅ Wide selection`,
    `✅ Fast delivery across Ethiopia`,
  ].join('\n');
}

function getAboutMessage(lang: 'en' | 'am'): string {  if (lang === 'am') {
    return [
      `ℹ️ *ስለ K-FORCE ETHIOPIA*`,
      ``,
      `K-FORCE ETHIOPIA የኢትዮጵያ *የቴኳንዶ እና ማሻሻያ መሣሪያዎች* ልዩ የመስመር ላይ ሱቅ ነው።`,
      ``,
      `*የምናቀርበው:*`,
      `• መከላከያ፣ ሄልሜት፣ የደረት መከላከያ`,
      `• የስፓሪንግ መሣሪያ፣ ጓንት፣ ቡትስ`,
      `• የልምምድ ዶቦክ እና ቀበቶ`,
      ``,
      `*እንዴት ማዘዝ እንደሚቻል:*`,
      `1. በድረ-ገጻችን ምርቶችን ይመልከቱ`,
      `2. ዕቃ ይምረጡና ያዙ`,
      `3. ሻጩን በስልክ/ዋትስአፕ/ቴሌግራም ያግኙ`,
      `4. ክፍያና አቅርቦትን በቀጥታ ያስተባብሩ`,
      ``,
      `🌐 *ድረ-ገጽ:* [${STORE_URL_BASE}](${STORE_URL})`,
    ].join('\n');
  }
  return [
    `ℹ️ *About K-FORCE ETHIOPIA*`,
    ``,
    `K-FORCE ETHIOPIA is Ethiopia's specialized online shop for *taekwondo and martial arts equipment*.`,
    ``,
    `We provide high-quality gear for practitioners of all levels — from white belt beginners to black belt masters.`,
    ``,
    `*How to order:*`,
      `1. Browse products on our website`,
      `2. Select items and place an order`,
      `3. Contact the seller via phone, WhatsApp, or Telegram`,
      `4. Arrange payment and delivery directly`,
      ``,
      `🌐 *Website:* [${STORE_URL_BASE}](${STORE_URL})`,
  ].join('\n');
}

function getHelpMessage(lang: 'en' | 'am'): string {
  if (lang === 'am') {
    return [
      `❓ *እርዳታ — K-FORCE ETHIOPIA*`,
      ``,
      `*የሚገኙ ትዕዛዞች:*`,
      `/start — የመግቢያ መልዕክት`,
      `/shop — መደብራችንን ይመልከቱ`,
      `/about — ስለ መደብራችን`,
      `/help — ይህን እርዳታ ያሳዩ`,
      `/language — ቋንቋ ይቀይሩ`,
      ``,
      `🌐 [${STORE_URL_BASE}](${STORE_URL})`,
    ].join('\n');
  }
  return [
    `❓ *Help — TKD Store*`,
    ``,
    `*Available Commands:*`,
    `/start — Welcome message with store overview`,
    `/shop — Browse our store`,
    `/about — Learn about TKD Store`,
    `/help — Show this help message`,
    `/language — Change language`,
    ``,
    `🌐 Website: [${STORE_URL_BASE}](${STORE_URL})`,
  ].join('\n');
}

// ---------- Language persistence ----------

async function getUserLang(chatId: number): Promise<'en' | 'am' | null> {
  try {
    await dbConnect();
    const u: any = await User.findOne({ telegramChatId: String(chatId) })
      .select('language languageChosenAt')
      .lean();
    // No record yet, or the user never explicitly picked a language → treat as
    // a first-time interaction so the picker is shown.
    if (!u || !u.languageChosenAt) return null;
    return u.language === 'am' ? 'am' : 'en';
  } catch {
    return null;
  }
}

async function saveUserLang(chatId: number, lang: 'en' | 'am') {
  try {
    await dbConnect();
    const id = String(chatId);
    await User.findOneAndUpdate(
      { telegramChatId: id },
      {
        $set: { language: lang, languageChosenAt: new Date() },
        $setOnInsert: {
          telegramChatId: id,
          authId: `telegram-${id}`,
          name: 'Telegram User',
          email: `telegram-${id}@telegram.local`,
          firstName: 'Telegram',
          lastName: 'User',
          role: 'CUSTOMER',
          isActive: true,
        },
      },
      { upsert: true }
    );
  } catch (e) {
    console.error('Failed to save telegram language:', e);
  }
}

// ---------- Telegram API helpers ----------

function languageKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🇬🇧 English', callback_data: 'lang:en' },
        { text: '🇪🇹 አማርኛ', callback_data: 'lang:am' },
      ],
    ],
  };
}

async function sendLangPrompt(chatId: number, firstName?: string) {
  const name = firstName ? ` <b>${firstName}</b>` : '';
  const text = [
    `🌐 <b>Choose your language / ቋንቋ ይምረጡ</b>`,
    ``,
    `Hi${name}! Please choose a language.`,
    `ሰላም${name}! እባክዎ ቋንቋ ይምረጡ።`,
  ].join('\n');
  await sendTelegramMessage(chatId, text, 'HTML', languageKeyboard());
}

async function answerCallback(callbackId: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackId, text }),
    });
  } catch (e) {
    // non-critical
  }
}

// ---------- Handlers ----------

async function handleMessage(update: TelegramUpdate) {
  if (!update.message?.text || !update.message.chat) return;
  const chatId = update.message.chat.id;
  const text = update.message.text.trim().toLowerCase();
  const firstName = update.message.chat.first_name;
  const chatIdStr = String(chatId);

  // Language change command always available
  if (text === '/language' || text === '/ቋንቋ') {
    await sendLangPrompt(chatId, firstName);
    return;
  }

  // On first /start, show language choice before anything else
  if (text === '/start') {
    const known = await getUserLang(chatId);
    if (!known) {
      // Prompt language choice on first interaction
      await sendLangPrompt(chatId, firstName);
      return;
    }
    await sendTelegramMessage(chatId, getWelcomeMessage(known, firstName), 'Markdown');
    return;
  }

  if (!text.startsWith('/')) return;

  const lang = (await getUserLang(chatId)) ?? 'en';

  let reply: string;
  if (text === '/shop') {
    reply = getShopMessage(lang);
  } else if (text === '/about') {
    reply = getAboutMessage(lang);
  } else if (text === '/help') {
    reply = getHelpMessage(lang);
  } else {
    reply = getWelcomeMessage(lang, firstName);
  }

  await sendTelegramMessage(chatId, reply, 'Markdown');
}

async function handleCallback(update: TelegramUpdate) {
  const cq = update.callback_query;
  if (!cq?.data || !cq.message?.chat) return;
  const chatId = cq.message.chat.id;
  const data = cq.data;

  if (data === 'lang:en' || data === 'lang:am') {
    const lang = data === 'lang:am' ? 'am' : 'en';
    // Answer callback FIRST to acknowledge the button press within Telegram's 5s limit
    await answerCallback(cq.id, lang === 'am' ? 'ቋንቋ ወደ አማርኛ ተቀይሯል' : 'Language set to English');
    // Then save language and send welcome message
    await saveUserLang(chatId, lang);
    await sendTelegramMessage(chatId, getWelcomeMessage(lang, cq.message.chat.first_name), 'Markdown');
  }
}

// POST - Telegram webhook endpoint (used in production with HTTPS)
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    if (update.callback_query) {
      await handleCallback(update);
    } else if (update.message) {
      await handleMessage(update);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Always 200 to Telegram
  }
}

// GET - Manual polling for local development (no HTTPS needed)
export async function GET() {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({
      error: 'TELEGRAM_BOT_TOKEN not configured in .env.local',
      status: 'not_configured',
    }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=10&timeout=3`
    );
    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.description || 'Telegram API error', status: 'error' },
        { status: 500 }
      );
    }

    if (!data.result || data.result.length === 0) {
      return NextResponse.json({
        ok: true,
        status: 'no_updates',
        message: 'No pending messages. Send a command in Telegram (e.g. /start), then click Poll again.',
        processed: [],
      });
    }

    const processed: { from: string; message: string; chatId: number }[] = [];

    for (const update of data.result) {
      if (update.callback_query) {
        await handleCallback(update);
      } else if (update.message?.text) {
        const chatName = update.message.chat.first_name || 'Unknown';
        const text = update.message.text;
        processed.push({ from: chatName, message: text, chatId: update.message.chat.id });
        await handleMessage(update);
      }

      // Acknowledge the update so we don't re-process it
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${update.update_id + 1}&limit=1&timeout=0`
      );
    }

    return NextResponse.json({
      ok: true,
      status: 'processed',
      message: `Processed ${processed.length} message(s)`,
      processed,
    });
  } catch (error) {
    console.error('Telegram polling error:', error);
    return NextResponse.json(
      { error: 'Polling failed: ' + String(error), status: 'error' },
      { status: 500 }
    );
  }
}
