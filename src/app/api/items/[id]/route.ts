import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Item } from '@/models';
import { normalizePriceInput } from '@/lib/price';

/** Normalize flexible price fields (number, numeric string, or text like "300-700"). */
function normalizeSourceBlock(source: any) {
  if (!source || typeof source !== 'object') return source;
  const out: any = { ...source };
  if ('basePrice' in source) {
    const n = normalizePriceInput(source.basePrice);
    out.basePrice = n ?? 0;
  }
  if (Array.isArray(source.sizes)) {
    out.sizes = source.sizes.map((s: any) => {
      if (!s || typeof s !== 'object') return s;
      const size: any = { ...s };
      if ('price' in s) {
        const n = normalizePriceInput(s.price);
        if (n === undefined) delete size.price;
        else size.price = n;
      }
      return size;
    });
  }
  return out;
}

// GET /api/items/[id] - Get single item (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const item = await Item.findOne({ _id: id, isActive: true })
      .populate('categoryId', 'name nameAm imageUrl description descriptionAm')
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

    // Accept flexible prices (numbers or text like "300-700") on update
    if (body.local) body.local = normalizeSourceBlock(body.local);
    if (body.imported) body.imported = normalizeSourceBlock(body.imported);

    const item = await Item.findOneAndUpdate(
      { _id: id },
      body,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name nameAm description descriptionAm imageUrl');

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
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors || {}).map((e: any) => e.message).join(', ');
      return NextResponse.json({ error: message || 'Validation failed' }, { status: 400 });
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
