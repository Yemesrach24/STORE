import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    
    // Resolve the user by Mongo _id or by Google authId (profile forms send
    // the authId from the session).
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { authId: id };
    
    const user = await User.findOne(query).select('-__v').lean();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    
    // Resolve the user by Mongo _id or by Google authId (profile forms send
    // the authId from the session).
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { authId: id };
    
    const body = await request.json();
    
    // Check if email already exists (excluding current user)
    if (body.email) {
      const existingEmail = await User.findOne({
        email: body.email,
        _id: { $ne: id }
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }
    
    const user = await User.findOneAndUpdate(
      query,
      body,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    
    // Resolve the user by Mongo _id or by Google authId (profile forms send
    // the authId from the session).
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { authId: id };
    
    const user = await User.findOneAndUpdate(
      query,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 