import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Item, Category, Order, User } from '@/models';

// GET /api/admin/analytics - Admin dashboard analytics
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
      Order.countDocuments({}),
      Order.countDocuments({ status: 'PENDING' }),
      Order.countDocuments({ status: 'APPROVED' }),
      Order.countDocuments({ status: 'DECLINED' }),
      User.countDocuments({ role: 'CUSTOMER', isActive: true }),
      User.countDocuments({ role: { $in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true }),
      Item.countDocuments({ isActive: true, stockStatus: 'low_stock' }),
      Item.countDocuments({ isActive: true, stockStatus: 'out_of_stock' }),
      Order.aggregate([
        { $match: { status: 'APPROVED' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, avgOrderValue: { $avg: '$totalPrice' } } },
      ]),
      Order.find({}).sort({ createdAt: -1 }).limit(10).lean(),
      Order.aggregate([
        { $group: { _id: '$itemId', itemName: { $first: '$itemName' }, count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $group: { _id: '$itemCategory', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { count: -1 } },
      ]),
      // Company stats from orders
      Order.aggregate([
        { $match: { companyName: { $exists: true, $ne: '' } } },
        { $group: { _id: '$companyName', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return NextResponse.json({
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
