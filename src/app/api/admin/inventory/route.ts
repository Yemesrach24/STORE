import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Item from "@/models/Item";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const stock = searchParams.get("stock") || "";

    const skip = (page - 1) * limit;

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

    // Get total count
    const total = await Item.countDocuments(query);

    // Get items with user information
    const items = await Item.find(query)
      .populate('userId', 'name firstName lastName')
      .select({
        _id: 1,
        name: 1,
        description: 1,
        quantity: 1,
        price: 1,
        category: 1,
        userId: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate stats
    const statsQuery = {};
    const totalItems = await Item.countDocuments(statsQuery);
    const totalValue = await Item.aggregate([
      { $match: statsQuery },
      { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$quantity"] } } } }
    ]);
    
    const lowStockItems = await Item.countDocuments({ quantity: { $gt: 0, $lte: 10 } });
    const outOfStockItems = await Item.countDocuments({ quantity: 0 });
    
    const averagePriceResult = await Item.aggregate([
      { $match: statsQuery },
      { $group: { _id: null, average: { $avg: "$price" } } }
    ]);
    
    const totalCategories = await Item.distinct("category");

    const stats = {
      totalItems,
      totalValue: totalValue[0]?.total || 0,
      lowStockItems,
      outOfStockItems,
      averagePrice: averagePriceResult[0]?.average || 0,
      totalCategories: totalCategories.length,
    };

    return NextResponse.json({
      items: items.map(item => ({
        _id: item._id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        category: item.category,
        userId: item.userId._id,
        userName: item.userId.name || `${item.userId.firstName} ${item.userId.lastName}`,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      stats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    
    if (error instanceof Error && error.message.includes("Admin access required")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 