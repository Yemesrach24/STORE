import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Detect the public app URL for webhook registration.
function getAppBaseUrl(): string {
  // Explicit override (recommended in production).
  if (process.env.TELEGRAM_WEBHOOK_URL) {
    return process.env.TELEGRAM_WEBHOOK_URL.replace(/\/$/, '');
  }
  // Vercel injects the public deployment URL.
  const vercelUrl = process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  // Next.js public URL fallback.
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

function isHttps(url: string): boolean {
  return url.startsWith('https://');
}

// GET /api/telegram/setup - Configure bot commands and register/clear the webhook
export async function GET() {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({
      error: 'TELEGRAM_BOT_TOKEN not configured in .env.local',
      instructions: [
        '1. Create a bot via @BotFather on Telegram',
        '2. Add TELEGRAM_BOT_TOKEN=your_token to .env.local',
        '3. Restart the dev server',
        '4. Visit this page again',
      ],
    }, { status: 500 });
  }

  try {
    // Get bot info
    const botInfoRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const botInfoData = await botInfoRes.json();

    // Set bot commands (menu)
    const commandsRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'Welcome message with store info' },
          { command: 'shop', description: 'Browse our taekwondo store' },
          { command: 'about', description: 'Learn about TKD Store' },
          { command: 'help', description: 'Get help and instructions' },
        ],
      }),
    });
    const commandsResult = await commandsRes.json();

    // Set bot description
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: '🥋 TKD Store - Premium taekwondo equipment. Browse, order, and connect with sellers directly.',
      }),
    });

    // Set bot short description (shown in bot profile)
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyShortDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_description: '🥋 Premium Taekwondo Equipment Store',
      }),
    });

    // Webhook registration:
    // - Production (HTTPS URL): register the webhook so Telegram pushes updates
    //   to /api/telegram/webhook automatically (instant replies).
    // - Local development (http://localhost): no HTTPS, so clear the webhook
    //   and rely on manual polling via GET /api/telegram/webhook.
    const baseUrl = getAppBaseUrl();
    const webhookUrl = `${baseUrl}/api/telegram/webhook`;

    let webhookResult: any = null;
    if (isHttps(baseUrl)) {
      const setRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message'],
        }),
      });
      webhookResult = await setRes.json();
    } else {
      // Local dev: clear webhook so getUpdates polling works.
      const delRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`);
      webhookResult = await delRes.json();
    }

    // Check webhook status
    const webhookInfoRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const webhookInfo = await webhookInfoRes.json();

    const registered = isHttps(baseUrl);

    return NextResponse.json({
      success: true,
      botInfo: botInfoData?.result,
      commandsConfigured: commandsResult?.ok,
      webhookRegistered: registered ? webhookResult?.ok : false,
      webhookCleared: registered ? false : webhookResult?.ok,
      webhookUrl: registered ? webhookUrl : null,
      webhookInfo: webhookInfo?.result,
      instructions: registered
        ? [
            '✅ Bot commands menu has been configured',
            '✅ Bot description has been set',
            '✅ Webhook registered (automatic replies enabled)',
            '',
            '📱 HOW TO TEST THE BOT:',
            '1. Open Telegram and search for @' + (botInfoData?.result?.username || 'your_bot'),
            '2. Click "Start" or type /start',
            '3. You should receive the welcome message instantly (no manual polling needed)',
            '4. Try /shop, /about, /help commands',
            '',
            '🔔 HOW TO GET YOUR CHAT ID (for notifications):',
            '1. Send any message to the bot (e.g. /start)',
            '2. Copy the Chat ID shown in the processed messages, or use @userinfobot',
            '3. Go to Admin > Telegram > Paste Chat ID',
          ]
        : [
            '✅ Bot commands menu has been configured',
            '✅ Bot description has been set',
            '✅ Webhook cleared (local development polling mode)',
            '',
            '📱 HOW TO TEST THE BOT (localhost):',
            '1. Open Telegram and search for @' + (botInfoData?.result?.username || 'your_bot'),
            '2. Click "Start" or type /start',
            '3. Visit /api/telegram/webhook to process the message and receive a reply',
            '',
            '🚀 FOR PRODUCTION: Deploy to Vercel (HTTPS),',
            '   then revisit this page to auto-register the webhook',
          ],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Setup failed: ' + String(error) }, { status: 500 });
  }
}
