import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { Item, User, Transaction } from '@/models';
import { itemIdSchema, updateItemSchema, quantityUpdateSchema } from '@/lib/validations/item';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Validate item ID
    const { id } = itemIdSchema.parse(params);
    
    // Get user from database
    const user = await User.findOne({ clerkId: userId, isActive: true });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const item = await Item.findOne({
      _id: id,
      userId: user._id,
      isActive: true
    }).lean();
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error fetching item:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid item ID format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Validate item ID
    const { id } = itemIdSchema.parse(params);
    
    // Get user from database
    const user = await User.findOne({ clerkId: userId, isActive: true });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Validate update data
    const updateData = updateItemSchema.parse(body);
    
    const item = await Item.findOneAndUpdate(
      {
        _id: id,
        userId: user._id,
        isActive: true
      },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error updating item:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Validate item ID
    const { id } = itemIdSchema.parse(params);
    
    // Get user from database
    const user = await User.findOne({ clerkId: userId, isActive: true });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const item = await Item.findOneAndUpdate(
      {
        _id: id,
        userId: user._id,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid item ID format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}

// PATCH endpoint for quantity updates
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Validate item ID
    const { id } = itemIdSchema.parse(params);
    
    // Get user from database
    const user = await User.findOne({ clerkId: userId, isActive: true });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Validate quantity update data
    const { quantity, reason, notes } = quantityUpdateSchema.parse(body);
    
    // Get current item
    const item = await Item.findOne({
      _id: id,
      userId: user._id,
      isActive: true
    });
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    const previousQuantity = item.quantity;
    const quantityChange = quantity - previousQuantity;
    
    // Determine transaction type
    let transactionType: 'IN' | 'OUT' | 'ADJUSTMENT' = 'ADJUSTMENT';
    if (quantityChange > 0) {
      transactionType = 'IN';
    } else if (quantityChange < 0) {
      transactionType = 'OUT';
    }
    
    // Update item quantity
    item.quantity = quantity;
    await item.save();
    
    // Create transaction record if there's a quantity change
    if (quantityChange !== 0) {
      const transaction = new Transaction({
        itemId: item._id,
        type: transactionType,
        quantity: Math.abs(quantityChange),
        previousQuantity,
        newQuantity: quantity,
        reason,
        notes,
        userId: user._id,
        transactionDate: new Date()
      });
      
      await transaction.save();
    }
    
    return NextResponse.json({
      item,
      transaction: quantityChange !== 0 ? 'Transaction recorded' : 'No transaction needed'
    });
  } catch (error: any) {
    console.error('Error updating item quantity:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update item quantity' },
      { status: 500 }
    );
  }
} 