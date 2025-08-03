import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (status && status !== "all") {
      query.isActive = status === "active";
    }

    // Get all users
    const users = await User.find(query)
      .select({
        name: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        role: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ createdAt: -1 });

    // Convert to CSV
    const csvHeaders = [
      "Name",
      "Email",
      "First Name",
      "Last Name",
      "Role",
      "Status",
      "Created At",
      "Last Updated",
    ];

    const csvRows = users.map(user => [
      user.name,
      user.email,
      user.firstName,
      user.lastName,
      user.role,
      user.isActive ? "Active" : "Inactive",
      new Date(user.createdAt).toISOString(),
      new Date(user.updatedAt).toISOString(),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    // Create response with CSV headers
    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set("Content-Disposition", `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);

    return response;
  } catch (error) {
    console.error("Error exporting users:", error);
    
    if (error instanceof Error && error.message.includes("Admin access required")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 