import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Item from "@/models/Item";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    await dbConnect();

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = totalUsers - activeUsers;

    // Calculate new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Calculate growth rate (simplified - would need historical data for real calculation)
    const growthRate = totalUsers > 0 ? Math.round((newThisMonth / totalUsers) * 100) : 0;

    // Get inventory statistics
    const totalItems = await Item.countDocuments();
    const totalValueResult = await Item.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$quantity"] } } } }
    ]);
    const totalValue = totalValueResult[0]?.total || 0;

    const lowStockItems = await Item.countDocuments({ quantity: { $gt: 0, $lte: 10 } });
    const outOfStockItems = await Item.countDocuments({ quantity: 0 });

    const averagePriceResult = await Item.aggregate([
      { $group: { _id: null, average: { $avg: "$price" } } }
    ]);
    const averagePrice = averagePriceResult[0]?.average || 0;

    // System statistics (mock data for now)
    const systemStats = {
      uptime: 99.9,
      databaseSize: "2.5 MB",
      lastBackup: new Date().toLocaleDateString(),
      activeSessions: Math.floor(Math.random() * 10) + 1, // Mock data
    };

    // Recent activity (mock data for now)
    const recentActivity = [
      {
        id: "1",
        type: "user_login",
        description: "User logged in",
        timestamp: new Date().toISOString(),
        user: "John Doe",
      },
      {
        id: "2",
        type: "item_created",
        description: "New item added to inventory",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: "Jane Smith",
      },
      {
        id: "3",
        type: "user_registered",
        description: "New user registered",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        user: "System",
      },
    ];

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        newThisMonth,
        growthRate,
      },
      inventory: {
        totalItems,
        totalValue,
        lowStockItems,
        outOfStockItems,
        averagePrice,
      },
      system: systemStats,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    
    if (error instanceof Error && error.message.includes("Admin access required")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 