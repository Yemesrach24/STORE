import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Item, Category } from '@/models';
import { normalizePriceInput } from '@/lib/price';

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
      // Public access (same search behaviour as admin/shop endpoints)
      const query: any = { isActive: true };
      if (categoryId) query.categoryId = categoryId;
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
          { name: { $regex: escaped, $options: 'i' } },
          { nameAm: { $regex: escaped, $options: 'i' } },
          { nameKo: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { descriptionAm: { $regex: escaped, $options: 'i' } },
          { descriptionKo: { $regex: escaped, $options: 'i' } },
          { color: { $regex: escaped, $options: 'i' } },
          { colorAm: { $regex: escaped, $options: 'i' } },
          { colorKo: { $regex: escaped, $options: 'i' } },
          { tags: { $regex: escaped, $options: 'i' } },
          { tagsAm: { $regex: escaped, $options: 'i' } },
          { tagsKo: { $regex: escaped, $options: 'i' } },
        ];
      }

      const [items, total] = await Promise.all([
        Item.find(query).populate('categoryId', 'name nameAm nameKo description descriptionAm descriptionKo imageUrl').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { nameAm: { $regex: escaped, $options: 'i' } },
        { nameKo: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { descriptionAm: { $regex: escaped, $options: 'i' } },
        { descriptionKo: { $regex: escaped, $options: 'i' } },
        { color: { $regex: escaped, $options: 'i' } },
        { colorAm: { $regex: escaped, $options: 'i' } },
        { colorKo: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } },
        { tagsAm: { $regex: escaped, $options: 'i' } },
        { tagsKo: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Item.find(query).populate('categoryId', 'name nameAm nameKo description descriptionAm descriptionKo imageUrl').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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
    const { name, nameAm, nameKo, description, descriptionAm, descriptionKo, uniqueNumber, categoryId, color, colorAm, colorKo, supplier, supplierAm, supplierKo, imageUrl, imageUrls, tags, tagsAm, tagsKo, location, companyName, companyNameAm, companyNameKo, companyPhone, companyWhatsapp, companyTelegram, companyInstagram, companyEmail, local, imported } = body;

    if (!name || !description || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // At least one of local or imported must be enabled
    const localEnabled = local?.enabled === true;
    const importedEnabled = imported?.enabled === true;
    if (!localEnabled && !importedEnabled) {
      return NextResponse.json({ error: 'At least one of Local or Imported must be enabled' }, { status: 400 });
    }

    // Verify category exists
    const category = await Category.findOne({ _id: categoryId, isActive: true });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    // Generate unique number if not provided
    const finalUniqueNumber = uniqueNumber || `KF-${Date.now().toString(36).toUpperCase()}`;

    const item = new Item({
      name,
      nameAm: nameAm || undefined,
      nameKo: nameKo || undefined,
      description,
      descriptionAm: descriptionAm || undefined,
      descriptionKo: descriptionKo || undefined,
      uniqueNumber: finalUniqueNumber,
      categoryId,
      color: color || undefined,
      colorAm: colorAm || undefined,
      colorKo: colorKo || undefined,
      local: {
        enabled: localEnabled,
        basePrice: localEnabled ? (normalizePriceInput(local.basePrice) ?? 0) : 0,
        sizes: (localEnabled && Array.isArray(local.sizes) ? local.sizes : []).map((s: any) => ({
          name: s.name,
          nameAm: s.nameAm || undefined,
          nameKo: s.nameKo || undefined,
          price: normalizePriceInput(s.price),
        })),
      },
      imported: {
        enabled: importedEnabled,
        basePrice: importedEnabled ? (normalizePriceInput(imported.basePrice) ?? 0) : 0,
        sizes: (importedEnabled && Array.isArray(imported.sizes) ? imported.sizes : []).map((s: any) => ({
          name: s.name,
          nameAm: s.nameAm || undefined,
          nameKo: s.nameKo || undefined,
          price: normalizePriceInput(s.price),
        })),
      },
      supplier: supplier || undefined,
      supplierAm: supplierAm || undefined,
      supplierKo: supplierKo || undefined,
      imageUrl,
      imageUrls: imageUrls || (imageUrl ? [imageUrl] : []),
      tags,
      tagsAm: tagsAm || undefined,
      tagsKo: tagsKo || undefined,
      location,
      companyName,
      companyNameAm: companyNameAm || undefined,
      companyNameKo: companyNameKo || undefined,
      companyPhone,
      companyWhatsapp,
      companyTelegram,
      companyInstagram,
      companyEmail,
      createdBy: user.dbUserId,
    });

    await item.save();
    await item.populate('categoryId', 'name nameAm nameKo description descriptionAm descriptionKo imageUrl');
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Item with this unique number already exists' }, { status: 400 });
    }
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors || {}).map((e: any) => e.message).join(', ');
      return NextResponse.json({ error: message || 'Validation failed' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
