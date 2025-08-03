import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { Item, User } from '@/models';
import { itemQuerySchema } from '@/lib/validations/item';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Get user from database
    const user = await User.findOne({ clerkId: userId, isActive: true });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validatedQuery = itemQuerySchema.parse(queryParams);
    
    const { page, limit, search, category, minPrice, maxPrice, inStock, lowStock, sortBy, sortOrder } = validatedQuery;
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = { 
      userId: user._id,
      isActive: true 
    };
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }
    
    // Stock filters
    if (inStock === true) {
      query.quantity = { $gt: 0 };
    }
    
    if (lowStock === true) {
      query.$expr = { $lte: ['$quantity', '$minQuantity'] };
    }
    
    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const [items, total] = await Promise.all([
      Item.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(query)
    ]);
    
    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch items' },
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
    
    // Get user from database
    const user = await User.findOne({ clerkId: userId, isActive: true });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Create item with user ID
    const itemData = {
      ...body,
      userId: user._id
    };
    
    const item = new Item(itemData);
    await item.save();
    
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    if (error.message === 'SKU or barcode already exists') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
} 