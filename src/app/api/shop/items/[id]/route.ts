import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Item } from '@/models';

// GET /api/shop/items/[id] - Public: get single item detail
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
    console.error('Error fetching shop item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}
