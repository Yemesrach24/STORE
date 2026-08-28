import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// GET /api/telegram/setup - Configure bot commands and show instructions
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
    const descRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyDescription`, {
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

    // For local dev: delete webhook (so getUpdates works)
    const delRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`);
    const delResult = await delRes.json();

    // Check webhook status
    const webhookInfoRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const webhookInfo = await webhookInfoRes.json();

    return NextResponse.json({
      success: true,
      botInfo: botInfoData?.result,
      commandsConfigured: commandsResult?.ok,
      webhookCleared: delResult?.ok,
      webhookInfo: webhookInfo?.result,
      instructions: [
        '✅ Bot commands menu has been configured',
        '✅ Bot description has been set',
        '✅ Webhook cleared (for local development polling)',
        '',
        '📱 HOW TO TEST THE BOT:',
        '1. Open Telegram and search for @' + (botInfoData?.result?.username || 'your_bot'),
        '2. Click "Start" or type /start',
        '3. You should see the welcome message with store info',
        '4. Try /shop, /about, /help commands',
        '',
        '🔔 HOW TO GET YOUR CHAT ID (for notifications):',
        '1. Send /myid to the bot',
        '2. Copy the Chat ID number',
        '3. Go to Admin > Telegram > Paste Chat ID',
        '',
        '⚡ IMPORTANT: After sending a command in Telegram,',
        '   visit /api/telegram/webhook to process the message',
        '   (This is needed because localhost has no HTTPS for webhooks)',
        '',
        '🚀 FOR PRODUCTION: Deploy to Vercel/Netlify (HTTPS),',
        '   then visit /api/telegram/setup to register the webhook',
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Setup failed: ' + String(error) }, { status: 500 });
  }
}
