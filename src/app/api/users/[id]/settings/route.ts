import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { z } from "zod";

const settingsSchema = z.object({
  timezone: z.string().optional(),
  language: z.string().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  lowStockAlerts: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  autoLogout: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is updating their own settings
    if (userId !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    // Update user settings
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        $set: {
          ...validatedData,
          updatedAt: new Date(),
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Settings updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        imageUrl: updatedUser.imageUrl,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        phone: updatedUser.phone,
        location: updatedUser.location,
        bio: updatedUser.bio,
        timezone: updatedUser.timezone,
        language: updatedUser.language,
        currency: updatedUser.currency,
        dateFormat: updatedUser.dateFormat,
        emailNotifications: updatedUser.emailNotifications,
        lowStockAlerts: updatedUser.lowStockAlerts,
        weeklyReports: updatedUser.weeklyReports,
        marketingEmails: updatedUser.marketingEmails,
        theme: updatedUser.theme,
        autoLogout: updatedUser.autoLogout,
        twoFactorAuth: updatedUser.twoFactorAuth,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is accessing their own settings
    if (userId !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const user = await User.findOne({ clerkId: userId }).select({
      _id: 1,
      name: 1,
      email: 1,
      firstName: 1,
      lastName: 1,
      imageUrl: 1,
      role: 1,
      isActive: 1,
      phone: 1,
      location: 1,
      bio: 1,
      timezone: 1,
      language: 1,
      currency: 1,
      dateFormat: 1,
      emailNotifications: 1,
      lowStockAlerts: 1,
      weeklyReports: 1,
      marketingEmails: 1,
      theme: 1,
      autoLogout: 1,
      twoFactorAuth: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        timezone: user.timezone,
        language: user.language,
        currency: user.currency,
        dateFormat: user.dateFormat,
        emailNotifications: user.emailNotifications,
        lowStockAlerts: user.lowStockAlerts,
        weeklyReports: user.weeklyReports,
        marketingEmails: user.marketingEmails,
        theme: user.theme,
        autoLogout: user.autoLogout,
        twoFactorAuth: user.twoFactorAuth,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 