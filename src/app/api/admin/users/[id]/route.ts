import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

// PUT /api/admin/users/[id] - Update user (SUPER_ADMIN only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin();
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { role, isActive, phone, whatsapp, telegram, instagram, shopName, shopDescription } = body;

    // Don't allow changing own role
    if (id === user.dbUserId && role && role !== user.role) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (phone !== undefined) updateData.phone = phone;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
    if (telegram !== undefined) updateData.telegram = telegram;
    if (instagram !== undefined) updateData.instagram = instagram;
    if (shopName !== undefined) updateData.shopName = shopName;
    if (shopDescription !== undefined) updateData.shopDescription = shopDescription;

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-__v');
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can manage users' }, { status: 403 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Deactivate user (SUPER_ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin();
    await dbConnect();

    const { id } = await params;

    if (id === user.dbUserId) {
      return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
    }

    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only SUPER_ADMIN can deactivate other SUPER_ADMINs
    if (target.role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can deactivate other admins' }, { status: 403 });
    }

    target.isActive = false;
    await target.save();

    return NextResponse.json({ message: 'User deactivated successfully' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can manage users' }, { status: 403 });
    }
    console.error('Error deactivating user:', error);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
