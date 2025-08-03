import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

export interface AdminUser {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }
  
  try {
    await dbConnect();
    
    let user = await User.findOne({ clerkId: userId, isActive: true });
    
    // If user doesn't exist, create them (fallback for when webhook fails)
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

export async function ensureUserExists(clerkId: string) {
  try {
    // Extract a name from the clerkId for fallback
    const fallbackName = `User_${clerkId.slice(-6)}`;
    const fallbackEmail = `${clerkId}@placeholder.com`;
    
    // Create a basic user record with required fields
    const user = new User({
      clerkId,
      name: fallbackName,
      email: fallbackEmail,
      firstName: fallbackName.split('_')[0] || 'User',
      lastName: fallbackName.split('_')[1] || 'Account',
      role: 'user',
      isActive: true,
      // Set default preferences
      emailNotifications: true,
      lowStockAlerts: true,
      weeklyReports: false,
      marketingEmails: false,
      theme: 'system',
      autoLogout: false,
      twoFactorAuth: false,
      language: 'en',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timezone: 'UTC'
    });
    
    await user.save();
    console.log('Created fallback user:', user._id);
    return user;
  } catch (error) {
    console.error('Error creating fallback user:', error);
    
    // If user creation fails due to validation, try to create with minimal data
    try {
      console.log('Attempting to create user with minimal data...');
      const minimalUser = new User({
        clerkId,
        name: `User_${clerkId.slice(-6)}`,
        email: `${clerkId}@placeholder.com`,
        firstName: 'User',
        lastName: 'Account',
        role: 'user',
        isActive: true
      });
      
      await minimalUser.save();
      console.log('Created minimal fallback user:', minimalUser._id);
      return minimalUser;
    } catch (minimalError) {
      console.error('Error creating minimal fallback user:', minimalError);
      return null;
    }
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}

export async function requireManagerOrAdmin() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (user.role !== 'admin' && user.role !== 'manager') {
    throw new Error('Manager or admin access required');
  }
  
  return user;
}

export function isAdmin(role: string): boolean {
  return role === 'admin';
}

export function isManagerOrAdmin(role: string): boolean {
  return role === 'admin' || role === 'manager';
} 