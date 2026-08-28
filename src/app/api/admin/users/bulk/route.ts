import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { z } from "zod";

const bulkActionSchema = z.object({
  action: z.enum(["activate", "deactivate", "delete", "changeRole"]),
  userIds: z.array(z.string()).min(1, "At least one user ID is required"),
  role: z.enum(["admin", "manager", "user"]).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    await dbConnect();

    const body = await request.json();
    const validatedData = bulkActionSchema.parse(body);

    const { action, userIds, role } = validatedData;

    // Validate that all users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return NextResponse.json(
        { error: "Some users not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let message = "";

    switch (action) {
      case "activate":
        updateData = { isActive: true };
        message = "Users activated successfully";
        break;

      case "deactivate":
        updateData = { isActive: false };
        message = "Users deactivated successfully";
        break;

      case "delete":
        // Check if we're trying to delete the last admin
        const adminUsers = users.filter(user => user.role === 'admin');
        const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });
        
        if (adminUsers.length > 0 && totalAdmins <= adminUsers.length) {
          return NextResponse.json(
            { error: "Cannot delete the last admin user" },
            { status: 400 }
          );
        }
        
        updateData = { isActive: false };
        message = "Users deleted successfully";
        break;

      case "changeRole":
        if (!role) {
          return NextResponse.json(
            { error: "Role is required for changeRole action" },
            { status: 400 }
          );
        }

        // Check if we're changing the last admin to a different role
        if (role !== 'admin') {
          const adminUsers = users.filter(user => user.role === 'admin');
          const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });
          
          if (adminUsers.length > 0 && totalAdmins <= adminUsers.length) {
            return NextResponse.json(
              { error: "Cannot change the last admin user's role" },
              { status: 400 }
            );
          }
        }

        updateData = { role };
        message = "User roles updated successfully";
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    // Perform bulk update
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updateData }
    );

    return NextResponse.json({
      message,
      updatedCount: result.modifiedCount,
      totalRequested: userIds.length,
    });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Admin access required")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 