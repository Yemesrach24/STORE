import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';

export interface AuthUser {
  userId: string; // authId from session
  dbUserId: string; // MongoDB _id
  role: UserRole;
  name: string;
  email: string;
}

/**
 * Get the authenticated user from the session and database.
 * Auto-creates the user if they don't exist yet.
 * First user becomes SUPER_ADMIN, subsequent users become CUSTOMER.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  let session;
  try {
    session = await auth();
  } catch (err) {
    console.error('Auth session error:', err);
    return null;
  }
  if (!session?.user?.id) return null;

  try {
    await dbConnect();
  } catch (err) {
    console.error('Database connection error:', err);
    return null;
  }
  let user = await User.findOne({ authId: session.user.id, isActive: true }).catch(() => null);
  
  if (!user) {
    // Try to find by email first (in case signIn callback already created this user)
    if (session.user.email) {
      user = await User.findOne({ email: session.user.email }).catch(() => null);
      if (user) {
        // Link this authId to the existing user
        user.authId = session.user.id;
        await user.save().catch(() => {});
      }
    }
  }

  if (!user) {
    // Auto-create user — always CUSTOMER (SUPER_ADMIN/ADMIN are created manually)
    try {
      user = new User({
        authId: session.user.id,
        name: session.user.name || 'User',
        email: session.user.email || '',
        firstName: session.user.name?.split(' ')[0] || 'User',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || ' ',
        imageUrl: session.user.image || undefined,
        role: 'CUSTOMER',
        isActive: true,
        theme: 'system',
        language: 'en',
        currency: 'ETB',
        timezone: 'UTC',
      });
      await user.save();
      console.log(`Auto-created user: ${user.name} (role: CUSTOMER)`);
    } catch (createErr: any) {
      if (createErr?.code === 11000) {
        // Duplicate email — find existing user by email
        user = await User.findOne({ email: session.user.email }).catch(() => null);
      }
      if (!user) {
        console.error('Failed to create or find user:', createErr);
      }
    }
  }

  return {
    userId: session.user.id,
    dbUserId: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
  };
}

/**
 * Require a specific role. Throws if user doesn't have it.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

/**
 * Check if user is admin (SUPER_ADMIN or ADMIN)
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(['SUPER_ADMIN', 'ADMIN']);
}

/**
 * Check if user is SUPER_ADMIN only
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  return requireRole(['SUPER_ADMIN']);
}

/**
 * Check if user is a customer
 */
export async function requireCustomer(): Promise<AuthUser> {
  return requireRole(['CUSTOMER']);
}
