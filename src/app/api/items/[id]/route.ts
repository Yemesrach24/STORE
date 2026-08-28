import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Item } from '@/models';

// GET /api/items/[id] - Get single item (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const item = await Item.findOne({ _id: id, isActive: true })
      .populate('categoryId', 'name imageUrl description')
      .lean();

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PUT /api/items/[id] - Update item (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const item = await Item.findOneAndUpdate(
      { _id: id },
      body,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name imageUrl');

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error updating item:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'You do not have permission to update items' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/items/[id] - Soft delete item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    await dbConnect();

    const { id } = await params;
    const item = await Item.findOneAndUpdate(
      { _id: id },
      { isActive: false },
      { new: true }
    );

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'You do not have permission to delete items' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
