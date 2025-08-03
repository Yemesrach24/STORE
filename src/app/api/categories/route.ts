import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import Category from "@/models/Category";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const categories = await Category.find({ isActive: true })
      .select({ name: 1, description: 1, parentId: 1 })
      .sort({ name: 1 });

    return NextResponse.json({
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        description: cat.description,
        parentId: cat.parentId,
      })),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, description, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true 
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }

    const category = new Category({
      name,
      description,
      parentId,
      createdBy: userId,
      isActive: true,
    });

    await category.save();

    return NextResponse.json({
      message: "Category created successfully",
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        parentId: category.parentId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 