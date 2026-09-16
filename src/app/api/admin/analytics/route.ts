import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Item, Category, Order, User } from '@/models';

// GET /api/admin/analytics - Admin dashboard analytics
// Supports ?period=day|week|month|year to filter order-based stats by date range.
export async function GET(request: NextRequest) {
  try {
    let user;
    try {
      user = await requireSuperAdmin();
    } catch (authErr: any) {
      if (authErr?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (authErr?.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      throw authErr;
    }
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    // Compute date range based on period
    const now = new Date();
    let fromDate: Date | null = null;
    switch (period) {
      case 'day':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 30);
        break;
      case 'year':
        fromDate = new Date(now);
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        fromDate = null; // 'all' or unknown → no filter
    }

    const orderMatch: any = {};
    if (fromDate) orderMatch.createdAt = { $gte: fromDate };

    const [
      totalItems,
      totalCategories,
      totalOrders,
      pendingOrders,
      approvedOrders,
      declinedOrders,
      totalCustomers,
      totalAdmins,
      lowStockItems,
      outOfStockItems,
      orderStats,
      recentOrders,
      topItems,
      categoryStats,
      companyStats,
    ] = await Promise.all([
      Item.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Order.countDocuments(orderMatch),
      Order.countDocuments({ ...orderMatch, status: 'PENDING' }),
      Order.countDocuments({ ...orderMatch, status: 'APPROVED' }),
      Order.countDocuments({ ...orderMatch, status: 'DECLINED' }),
      User.countDocuments({ role: 'CUSTOMER', isActive: true }),
      User.countDocuments({ role: { $in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true }),
      0, // lowStockItems — no longer tracked
      0, // outOfStockItems — no longer tracked
      Order.aggregate([
        { $match: { ...orderMatch, status: 'APPROVED' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, avgOrderValue: { $avg: '$totalPrice' } } },
      ]),
      Order.find(orderMatch).sort({ createdAt: -1 }).limit(10).lean(),
      Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: '$itemId', itemName: { $first: '$itemName' }, count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: '$itemCategory', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { count: -1 } },
      ]),
      // Company stats from orders
      Order.aggregate([
        { $match: { ...orderMatch, companyName: { $exists: true, $ne: '' } } },
        { $group: { _id: '$companyName', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return NextResponse.json({
      period,
      inventory: {
        totalItems,
        totalCategories,
        lowStockItems,
        outOfStockItems,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        approved: approvedOrders,
        declined: declinedOrders,
      },
      users: {
        totalCustomers,
        totalAdmins,
      },
      revenue: {
        total: orderStats[0]?.totalRevenue || 0,
        average: orderStats[0]?.avgOrderValue || 0,
      },
      recentOrders,
      topItems,
      categoryStats,
      companyStats,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
