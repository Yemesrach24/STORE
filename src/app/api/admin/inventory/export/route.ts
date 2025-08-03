import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const stock = searchParams.get("stock") || "";

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (stock && stock !== "all") {
      switch (stock) {
        case "in-stock":
          query.quantity = { $gt: 10 };
          break;
        case "low-stock":
          query.quantity = { $gt: 0, $lte: 10 };
          break;
        case "out-of-stock":
          query.quantity = 0;
          break;
      }
    }

    // Get all items with user information
    const items = await Item.find(query)
      .populate('userId', 'name firstName lastName email')
      .select({
        name: 1,
        description: 1,
        quantity: 1,
        price: 1,
        category: 1,
        userId: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ createdAt: -1 });

    // Convert to CSV
    const csvHeaders = [
      "Item Name",
      "Description",
      "Quantity",
      "Price",
      "Total Value",
      "Category",
      "Owner Name",
      "Owner Email",
      "Created At",
      "Last Updated",
    ];

    const csvRows = items.map(item => [
      item.name,
      item.description,
      item.quantity,
      item.price.toFixed(2),
      (item.price * item.quantity).toFixed(2),
      item.category,
      item.userId.name || `${item.userId.firstName} ${item.userId.lastName}`,
      item.userId.email,
      new Date(item.createdAt).toISOString(),
      new Date(item.updatedAt).toISOString(),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    // Create response with CSV headers
    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set("Content-Disposition", `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.csv"`);

    return response;
  } catch (error) {
    console.error("Error exporting inventory:", error);
    
    if (error instanceof Error && error.message.includes("Admin access required")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 