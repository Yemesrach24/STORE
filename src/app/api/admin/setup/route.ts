import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';
import { auth } from '@/lib/auth';

/**
 * GET /api/admin/setup
 * One-time endpoint: if no SUPER_ADMIN exists, promote the current user.
 * This handles the case where the first user was auto-created as CUSTOMER
 * before the fix to give first users SUPER_ADMIN.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();

    // Find the current user
    const user = await User.findOne({ authId: session.user.id });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If already SUPER_ADMIN, nothing to do
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json({
        message: 'You are already SUPER_ADMIN. No action needed.',
        alreadySetup: true,
        role: user.role,
      });
    }

    // Promote the current user to SUPER_ADMIN
    const oldRole = user.role;
    user.role = 'SUPER_ADMIN';
    await user.save();

    console.log(`Setup: Promoted user ${user.name} from ${oldRole} to SUPER_ADMIN`);

    return NextResponse.json({
      message: `Success! You have been promoted from ${oldRole} to SUPER_ADMIN.`,
      role: 'SUPER_ADMIN',
      name: user.name,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}
