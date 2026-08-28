import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Item, User } from '@/models';
import Transaction from '@/models/Transaction';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const productId = searchParams.get('productId') || '';
    const type = searchParams.get('type') || '';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (productId) {
      query.productId = productId;
    }
    
    if (type) {
      query.type = type;
    }
    
    const transactions = await Transaction.find(query)
      .populate('productId', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Transaction.countDocuments(query);
    
    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    const body = await request.json();
    
    // Get user from database
    const user = await User.findOne({ authId: userId, isActive: true });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate product exists and belongs to user
    const product = await Item.findOne({ _id: body.productId, userId: user._id, isActive: true });
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Create transaction
    const transaction = new Transaction({
      ...body,
      userId: user._id
    });
    await transaction.save();
    
    // Update product quantity
    const quantityChange = body.type === 'IN' ? body.quantity : -body.quantity;
    const newQuantity = product.quantity + quantityChange;
    
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: 'Insufficient stock for this transaction' },
        { status: 400 }
      );
    }
    
    await Item.findByIdAndUpdate(body.productId, {
      quantity: newQuantity
    });
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
} 