import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Category } from '@/models';

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const category = await Category.findOneAndUpdate(
      { _id: id, createdBy: user.dbUserId },
      body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/categories/[id] - Soft delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    await dbConnect();

    const { id } = await params;
    const category = await Category.findOneAndUpdate(
      { _id: id, createdBy: user.dbUserId },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
