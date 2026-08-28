import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Category } from '@/models';

// GET /api/categories - List categories (admin sees all, public sees active)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const tree = searchParams.get('tree');

    let user;
    try {
      user = await requireAdmin();
    } catch {
      // Public access: return active categories only
      const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
      return NextResponse.json({ categories });
    }

    if (tree === 'true') {
      const allCats = await Category.find({ createdBy: user.dbUserId, isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();
      const buildTree = (parentId: string | null = null): any[] => {
        return allCats
          .filter((cat: any) => {
            const catParent = cat.parentId ? cat.parentId.toString() : null;
            return catParent === parentId;
          })
          .map((cat: any) => ({
            ...cat,
            children: buildTree(cat._id.toString()),
          }));
      };
      return NextResponse.json({ categories: buildTree() });
    }

    const categories = await Category.find({ createdBy: user.dbUserId, isActive: true })
      .sort({ sortOrder: 1, name: 1 });
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories - Create category (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    await dbConnect();

    const body = await request.json();
    const { name, description, imageUrl, parentId, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = new Category({
      name,
      description,
      imageUrl,
      parentId: parentId || null,
      createdBy: user.dbUserId,
      sortOrder: sortOrder || 0,
    });

    await category.save();
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.message === 'Category name already exists') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
