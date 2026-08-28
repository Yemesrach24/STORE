import { auth as getSession } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';
import type { UserRole } from '@/models/User';

export interface AuthSession {
  userId: string | null;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

// Drop-in replacement for auth() used by API routes and pages.
// Returns a session-compatible object where session.user.id is the Google account id.
export async function auth(): Promise<AuthSession> {
  const session = await getSession();
  return {
    userId: session?.user?.id ?? null,
    user: session?.user ? {
      id: session.user.id ?? '',
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    } : undefined,
  };
}

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    await dbConnect();
    let user = await User.findOne({ authId: userId, isActive: true });
    if (!user) {
      console.log('User not found in database, creating fallback user for:', userId);
      user = await ensureUserExists(userId);
    }
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

export async function ensureUserExists(authId: string) {
  try {
    // Check if user already exists (race condition guard)
    const existing = await User.findOne({ authId });
    if (existing) return existing;

    // Try to get real session data
    let session;
    try { session = await getSession(); } catch { session = null; }
    const realName = session?.user?.name || 'User';
    const realEmail = session?.user?.email || '';
    const firstName = realName.split(' ')[0] || 'User';
    const lastName = realName.split(' ').slice(1).join(' ') || '';

    const user = new User({
      authId,
      name: realName,
      email: realEmail,
      firstName,
      lastName,
      role: 'CUSTOMER',
      isActive: true,
      theme: 'system',
      language: 'en',
      currency: 'ETB',
      timezone: 'UTC',
    });

    await user.save();
    console.log(`Created fallback user: ${user._id} (role: CUSTOMER)`);
    return user;
  } catch (error) {
    console.error('Error creating fallback user:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');
  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) throw new Error('Admin access required');
  return user;
}

export function isAdmin(role: string): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(role);
}

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}
