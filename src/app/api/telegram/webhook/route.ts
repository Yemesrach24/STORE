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
}

function getWelcomeMessage(firstName?: string): string {
  const name = firstName ? ` <b>${firstName}</b>` : '';
  return [
    `🥋 *Welcome to TKD Store!*`,
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
    `[Visit TKD Store](${STORE_URL})`,
    ``,
    `Quality gear for every practitioner — from beginners to black belts! 💪`,
    ``,
    `Type /shop to browse, or /about to learn more about us.`,
  ].join('\n');
}

function getShopMessage(): string {
  return [
    `🥊 *TKD Store — Taekwondo Equipment*`,
    ``,
    `Browse our full catalog of martial arts gear:`,
    `[Visit TKD Store](${STORE_URL})`,
    ``,
    `✅ Quality guaranteed`,
    `✅ Wide selection`,
    `✅ Fast delivery across Ethiopia`,
  ].join('\n');
}

function getAboutMessage(): string {
  return [
    `ℹ️ *About TKD Store*`,
    ``,
    `TKD Store is Ethiopia's specialized online shop for *taekwondo and martial arts equipment*.`,
    ``,
    `We provide high-quality gear for practitioners of all levels — from white belt beginners to black belt masters.`,
    ``,
    `*Our Products:*`,
    `• Protective gear: pads, helmets, chest protectors`,
    `• Sparring equipment: gloves, boots, shin guards`,
    `• Training doboks (uniforms) and belts`,
    `• Training accessories and bags`,
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

function getHelpMessage(): string {
  return [
    `❓ *Help — TKD Store*`,
    ``,
    `*Available Commands:*`,
    `/start — Welcome message with store overview`,
    `/shop — Browse our store`,
    `/about — Learn about TKD Store`,
    `/help — Show this help message`,
    ``,
    `*How to order:*`,
    `1. Visit our website to browse products`,
    `2. Select your items and place an order`,
    `3. After approval, contact the seller`,
    `4. Arrange payment & delivery through direct contact`,
    ``,
    `🌐 Website: [${STORE_URL_BASE}](${STORE_URL})`,
  ].join('\n');
}

async function handleMessage(update: TelegramUpdate) {
  if (!update.message) return;

  const chatId = update.message.chat.id.toString();
  const text = update.message.text?.trim().toLowerCase() || '';
  const firstName = update.message.chat.first_name;

  if (!text.startsWith('/')) return;

  let reply: string;

  if (text === '/start' || text === '/website') {
    reply = text === '/start' ? getWelcomeMessage(firstName) : getShopMessage();
  } else if (text === '/shop') {
    reply = getShopMessage();
  } else if (text === '/about') {
    reply = getAboutMessage();
  } else if (text === '/help') {
    reply = getHelpMessage();
  } else {
    reply = getWelcomeMessage(firstName);
  }

  await sendTelegramMessage(chatId, reply, 'Markdown');
}

// POST - Telegram webhook endpoint (used in production with HTTPS)
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    await handleMessage(update);
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
      if (update.message?.text) {
        const chatName = update.message.chat.first_name || 'Unknown';
        const text = update.message.text;
        processed.push({
          from: chatName,
          message: text,
          chatId: update.message.chat.id,
        });

        try {
          await handleMessage(update);
        } catch (err) {
          console.error('Failed to handle message:', err);
        }
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
