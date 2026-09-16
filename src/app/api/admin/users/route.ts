import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, requireAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

// GET /api/admin/users - List users (SUPER_ADMIN sees all, ADMIN sees customers)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};

    if (user.role === 'SUPER_ADMIN') {
      // Super admin sees all users
      if (role) query.role = role;
    } else {
      // Regular admin only sees customers
      query.role = 'CUSTOMER';
    }

    const search = searchParams.get('search');
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { firstName: { $regex: escaped, $options: 'i' } },
        { lastName: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/admin/users - Create admin/user (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperAdmin();
    await dbConnect();

    const body = await request.json();
    const { email, name, firstName, lastName, role, phone, whatsapp, telegram, instagram } = body;

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Email, name, and role are required' }, { status: 400 });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'CUSTOMER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const newUser = new User({
      authId: `manual_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      firstName: firstName || name.split(' ')[0] || name,
      lastName: lastName || name.split(' ').slice(1).join(' ') || '',
      role,
      phone,
      whatsapp,
      telegram,
      instagram,
      isActive: true,
      theme: 'system',
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
    });

    await newUser.save();
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can create admin accounts' }, { status: 403 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
