import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/lib/auth';
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ authId: userId, isActive: true }).select({
      _id: 1,
      authId: 1,
      name: 1,
      email: 1,
      firstName: 1,
      lastName: 1,
      imageUrl: 1,
      role: 1,
      phone: 1,
      address: 1,
      isActive: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      authId: user.authId,
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      role: user.role,
      phone: user.phone || '',
      address: user.address || '',
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateUser(request: NextRequest) {
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
    const { firstName, lastName, name, imageUrl, phone, address } = body;
    
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (name !== undefined) updateData.name = name;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    
    const updatedUser = await User.findOneAndUpdate(
      { authId: userId, isActive: true },
      updateData,
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user profile' },
        { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return updateUser(request);
}

export async function PATCH(request: NextRequest) {
  return updateUser(request);
}