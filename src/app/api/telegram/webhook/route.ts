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

function getWelcomeMessage(lang: 'en' | 'am' | 'ko', firstName?: string): string {
  const name = firstName ? ` <b>${firstName}</b>` : '';
  if (lang === 'ko') {
    return [
      `🥋 <b>K-FORCE ETHIOPIA에 오신 것을 환영합니다!</b>`,
      ``,
      `안녕하세요${name}! 프리미엄 <b>태권도 장비</b> 전문 쇼핑몰입니다.`,
      ``,
      `<b>취급 품목:</b>`,
      `• 보호 패드 및 가드`,
      `• 도복 (유니폼)`,
      `• 스파링 장비`,
      `• 훈련 액세서리`,
      `• 벨트 및 액세서리`,
      ``,
      `🛒 <b>매장 둘러보기:</b>`,
      `[K-FORCE ETHIOPIA 방문](${STORE_URL})`,
      ``,
      `초보자부터 블랙벨트까지, 모든 수련생을 위한 고품질 장비! 💪`,
      ``,
      `/shop을 입력해 둘러보거나, /about으로 더 알아보세요.`,
    ].join('\n');
  }
  if (lang === 'am') {
    return [
      `🥋 <b>እንኳን ወደ K-FORCE ETHIOPIA በደህና መጡ!</b>`,
      ``,
      `ሰላም${name}! ጥራት ያለው <b>የቴኳንዶ መሣሪያ</b> የሚያገኙበት ቦታ.`,
      ``,
      `<b>የምናቀርበው:</b>`,
      `• መከላከያ ፓድና ጋሻዎች`,
      `• ዶቦክ (ዩኒፎርም)`,
      `• የስፓሪንግ መሣሪያዎች`,
      `• የልምምድ ተጨማሪዎች`,
      `• ቀበቶና ተጨማሪዎች`,
      ``,
      `🛒 <b>መደብራችንን ይጎብኙ:</b>`,
      `[ወደ K-FORCE ETHIOPIA](${STORE_URL})`,
      ``,
      `/shop ይጻፉ ለማሰስ ወይም /about ለበለጠ መረጃ።`,
    ].join('\n');
  }
  return [
    `🥋 <b>Welcome to K-FORCE ETHIOPIA!</b>`,
    ``,
    `Hi${name}! We are your one-stop shop for premium <b>taekwondo equipment</b>.`,
    ``,
    `<b>What we offer:</b>`,
    `• Protective Pads & Guards`,
    `• Doboks (Uniforms)`,
    `• Sparring Gear`,
    `• Training Accessories`,
    `• Belts & Accessories`,
    ``,
    `🛒 <b>Browse our store:</b>`,
    `[Visit K-FORCE ETHIOPIA](${STORE_URL})`,
    ``,
    `Quality gear for every practitioner — from beginners to black belts! 💪`,
    ``,
    `Type /shop to browse, or /about to learn more about us.`,
  ].join('\n');
}

function getShopMessage(lang: 'en' | 'am' | 'ko'): string {
  if (lang === 'ko') {
    return [
      `🥊 <b>K-FORCE ETHIOPIA — 태권도 장비</b>`,
      ``,
      `무술 장비 전체 카탈로그를 둘러보세요:`,
      `[K-FORCE ETHIOPIA 방문](${STORE_URL})`,
      ``,
      `✅ 품질 보증`,
      `✅ 다양한 선택`,
      `✅ 에티오피아 전역 빠른 배송`,
    ].join('\n');
  }
  if (lang === 'am') {
    return [
      `🥊 <b>K-FORCE ETHIOPIA — የቴኳንዶ መሣሪያዎች</b>`,
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
    `🥊 <b>K-FORCE ETHIOPIA — Taekwondo Equipment</b>`,
    ``,
    `Browse our full catalog of martial arts gear:`,
    `[Visit K-FORCE ETHIOPIA](${STORE_URL})`,
    ``,
    `✅ Quality guaranteed`,
    `✅ Wide selection`,
    `✅ Fast delivery across Ethiopia`,
  ].join('\n');
}

function getAboutMessage(lang: 'en' | 'am' | 'ko'): string {
  if (lang === 'ko') {
    return [
      `ℹ️ <b>K-FORCE ETHIOPIA 소개</b>`,
      ``,
      `K-FORCE ETHIOPIA는 에티오피아의 <b>태권도 및 무술 장비</b> 전문 온라인 숍입니다.`,
      ``,
      `화이트벨트 초보자부터 블랙벨트 마스터까지, 모든 수준의 수련생에게 고품질 장비를 제공합니다.`,
      ``,
      `<b>주문 방법:</b>`,
      `1. 웹사이트에서 상품 둘러보기`,
      `2. 상품을 선택하고 주문하기`,
      `3. 전화, 왓츠앱, 텔레그램으로 판매자에게 연락`,
      `4. 결제와 배송을 직접 협의`,
      ``,
      `🌐 <b>웹사이트:</b> [${STORE_URL_BASE}](${STORE_URL})`,
    ].join('\n');
  }
  if (lang === 'am') {
    return [
      `ℹ️ <b>ስለ K-FORCE ETHIOPIA</b>`,
      ``,
      `K-FORCE ETHIOPIA የኢትዮጵያ <b>የቴኳንዶ እና ማሻሻያ መሣሪያዎች</b> ልዩ የመስመር ላይ ሱቅ ነው።`,
      ``,
      `<b>የምናቀርበው:</b>`,
      `• መከላከያ፣ ሄልሜት፣ የደረት መከላከያ`,
      `• የስፓሪንግ መሣሪያ፣ ጓንት፣ ቡትስ`,
      `• የልምምድ ዶቦክ እና ቀበቶ`,
      ``,
      `<b>እንዴት ማዘዝ እንደሚቻል:</b>`,
      `1. በድረ-ገጻችን ምርቶችን ይመልከቱ`,
      `2. ዕቃ ይምረጡና ያዙ`,
      `3. ሻጩን በስልክ/ዋትስአፕ/ቴሌግራም ያግኙ`,
      `4. ክፍያና አቅርቦትን በቀጥታ ያስተባብሩ`,
      ``,
      `🌐 <b>ድረ-ገጽ:</b> [${STORE_URL_BASE}](${STORE_URL})`,
    ].join('\n');
  }
  return [
    `ℹ️ <b>About K-FORCE ETHIOPIA</b>`,
    ``,
    `K-FORCE ETHIOPIA is Ethiopia's specialized online shop for <b>taekwondo and martial arts equipment</b>.`,
    ``,
    `We provide high-quality gear for practitioners of all levels — from white belt beginners to black belt masters.`,
    ``,
    `<b>How to order:</b>`,
      `1. Browse products on our website`,
      `2. Select items and place an order`,
      `3. Contact the seller via phone, WhatsApp, or Telegram`,
      `4. Arrange payment and delivery directly`,
      ``,
      `🌐 <b>Website:</b> [${STORE_URL_BASE}](${STORE_URL})`,
  ].join('\n');
}

function getHelpMessage(lang: 'en' | 'am' | 'ko'): string {
  if (lang === 'ko') {
    return [
      `❓ <b>도움말 — K-FORCE ETHIOPIA</b>`,
      ``,
      `<b>사용 가능한 명령어:</b>`,
      `/language — 언어 변경`,
      `/start — 매장 소개와 함께 환영 메시지`,
      `/shop — 매장 둘러보기`,
      `/about — K-FORCE ETHIOPIA 소개`,
      `/help — 이 도움말 표시`,
      ``,
      `🌐 웹사이트: [${STORE_URL_BASE}](${STORE_URL})`,
    ].join('\n');
  }
  if (lang === 'am') {
    return [
      `❓ <b>እርዳታ — K-FORCE ETHIOPIA</b>`,
      ``,
      `<b>የሚገኙ ትዕዛዞች:</b>`,
      `/language — ቋንቋ ይቀይሩ`,
      `/start — የመግቢያ መልዕክት`,
      `/shop — መደብራችንን ይመልከቱ`,
      `/about — ስለ መደብራችን`,
      `/help — ይህን እርዳታ ያሳዩ`,
      ``,
      `🌐 [${STORE_URL_BASE}](${STORE_URL})`,
    ].join('\n');
  }
  return [
    `❓ <b>Help — K-FORCE ETHIOPIA</b>`,
    ``,
    `<b>Available Commands:</b>`,
    `/language — Change language`,
    `/start — Welcome message with store overview`,
    `/shop — Browse our store`,
    `/about — Learn about K-FORCE ETHIOPIA`,
    `/help — Show this help message`,
    ``,
    `🌐 Website: [${STORE_URL_BASE}](${STORE_URL})`,
  ].join('\n');
}

// ---------- Language persistence ----------

async function getUserLang(chatId: number): Promise<'en' | 'am' | 'ko' | null> {
  try {
    await dbConnect();
    const u: any = await User.findOne({ telegramChatId: String(chatId) })
      .select('language languageChosenAt')
      .lean();
    // No record yet, or the user never explicitly picked a language → treat as
    // a first-time interaction so the picker is shown.
    if (!u || !u.languageChosenAt) return null;
    if (u.language === 'am') return 'am';
    if (u.language === 'ko') return 'ko';
    return 'en';
  } catch {
    return null;
  }
}

async function saveUserLang(chatId: number, lang: 'en' | 'am' | 'ko') {
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
        { text: '🇰🇷 한국어', callback_data: 'lang:ko' },
      ],
    ],
  };
}

async function sendLangPrompt(chatId: number, firstName?: string) {
  const name = firstName ? ` <b>${firstName}</b>` : '';
  const text = [
    `🌐 <b>Choose your language / ቋንቋ ይምረጡ / 언어를 선택하세요</b>`,
    ``,
    `Hi${name}! Please choose a language.`,
    `ሰላም${name}! እባክዎ ቋንቋ ይምረጡ።`,
    `안녕하세요${name}! 언어를 선택해 주세요.`,
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

  // Language change command always available (English, Amharic, Korean)
  if (text === '/language' || text === '/ቋንቋ' || text === '/언어') {
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
    await sendTelegramMessage(chatId, getWelcomeMessage(known, firstName), 'HTML');
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

  await sendTelegramMessage(chatId, reply, 'HTML');
}

async function handleCallback(update: TelegramUpdate) {
  const cq = update.callback_query;
  if (!cq?.data || !cq.message?.chat) return;
  const chatId = cq.message.chat.id;
  const data = cq.data;

  if (data === 'lang:en' || data === 'lang:am' || data === 'lang:ko') {
    const lang = data === 'lang:am' ? 'am' : data === 'lang:ko' ? 'ko' : 'en';
    // Answer callback FIRST to acknowledge the button press within Telegram's 5s limit
    await answerCallback(
      cq.id,
      lang === 'am' ? 'ቋንቋ ወደ አማርኛ ተቀይሯል' : lang === 'ko' ? '언어가 한국어로 설정되었습니다' : 'Language set to English'
    );
    // Then save language and send welcome message
    await saveUserLang(chatId, lang);
    const welcomeMsg = getWelcomeMessage(lang, cq.message.chat.first_name);
    const sent = await sendTelegramMessage(chatId, welcomeMsg, 'HTML');
    if (!sent) {
      console.error(`[TG] Failed to send welcome message to chat ${chatId} (lang=${lang})`);
    }
  }
}

// POST - Telegram webhook endpoint (used in production with HTTPS)
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    if (update.callback_query) {
      console.log(`[TG webhook] callback_query received: data=${update.callback_query.data}, chatId=${update.callback_query.message?.chat?.id}`);
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
        const cbChat = update.callback_query.message?.chat;
        const cbName = cbChat?.first_name || 'Unknown';
        processed.push({ from: cbName, message: `[callback: ${update.callback_query.data}]`, chatId: cbChat?.id ?? 0 });
        console.log(`[TG poll] callback_query: data=${update.callback_query.data}, chatId=${cbChat?.id}`);
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
