import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Item, Category } from '@/models';

// GET /api/items - List items (admin sees all their items, public sees active)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let user;
    try {
      user = await requireAdmin();
    } catch {
      // Public access
      const query: any = { isActive: true };
      if (categoryId) query.categoryId = categoryId;

      const [items, total] = await Promise.all([
        Item.find(query).populate('categoryId', 'name imageUrl').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Item.countDocuments(query),
      ]);

      return NextResponse.json({
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    // Admin: get ALL items (any admin can see all items)
    const query: any = { isActive: true };
    if (categoryId) query.categoryId = categoryId;
    if (search) query.$text = { $search: search };

    const [items, total] = await Promise.all([
      Item.find(query).populate('categoryId', 'name imageUrl').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Item.countDocuments(query),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/items - Create item (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    await dbConnect();

    const body = await request.json();
    const { name, description, uniqueNumber, categoryId, size, color, price, quantity, supplier, imageUrl, imageUrls, tags, location, companyName, companyPhone, companyWhatsapp, companyTelegram, companyInstagram, companyEmail } = body;

    if (!name || !description || !categoryId || price === undefined || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify category exists
    const category = await Category.findOne({ _id: categoryId, isActive: true });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    // Generate unique number if not provided
    const finalUniqueNumber = uniqueNumber || `TKD-${Date.now().toString(36).toUpperCase()}`;

    const item = new Item({
      name,
      description,
      uniqueNumber: finalUniqueNumber,
      categoryId,
      size,
      color,
      price,
      quantity,
      supplier,
      imageUrl,
      imageUrls: imageUrls || (imageUrl ? [imageUrl] : []),
      tags,
      location,
      companyName,
      companyPhone,
      companyWhatsapp,
      companyTelegram,
      companyInstagram,
      companyEmail,
      createdBy: user.dbUserId,
    });

    await item.save();
    await item.populate('categoryId', 'name imageUrl');
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Item with this unique number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
