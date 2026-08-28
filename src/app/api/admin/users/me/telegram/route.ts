import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

// POST /api/admin/users/me/telegram - Save seller's Telegram chat ID
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAdmin();
    await dbConnect();

    const { telegramChatId } = await request.json();

    if (!telegramChatId || typeof telegramChatId !== 'string') {
      return NextResponse.json({ error: 'Valid chat ID is required' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { _id: authUser.dbUserId },
      { telegramChatId: telegramChatId.trim() },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Telegram chat ID saved successfully',
      telegramChatId: user.telegramChatId,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Error saving Telegram chat ID:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

// GET /api/admin/users/me/telegram - Get seller's Telegram chat ID
export async function GET() {
  try {
    const authUser = await requireAdmin();
    await dbConnect();

    const user = await User.findOne({ _id: authUser.dbUserId }).select('telegramChatId telegram');
    
    return NextResponse.json({
      ok: true,
      telegramChatId: user?.telegramChatId || '',
      telegramUsername: user?.telegram || '',
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching Telegram info:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
