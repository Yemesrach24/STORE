import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { Item, User } from '@/models';
import Transaction from '@/models/Transaction';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('Dashboard API: Starting request');
  
  try {
    const { userId } = await auth();
    console.log('Dashboard API: User authenticated:', userId ? 'Yes' : 'No');
    
    if (!userId) {
      console.log('Dashboard API: Unauthorized - no userId');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('Dashboard API: Connecting to database');
    await dbConnect();
    console.log('Dashboard API: Database connected successfully');
    
    // Get user from database (with fallback creation)
    console.log('Dashboard API: Fetching user from database');
    const user = await getCurrentUser();
    if (!user) {
      console.log('Dashboard API: Failed to get or create user');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    console.log('Dashboard API: User found:', user._id);

    // Get total products
    console.log('Dashboard API: Counting total items');
    const totalProducts = await Item.countDocuments({ userId: user._id, isActive: true });
    console.log('Dashboard API: Total items:', totalProducts);
    
    // Get low stock products (quantity <= minQuantity)
    console.log('Dashboard API: Counting low stock items');
    const lowStockProducts = await Item.countDocuments({
      userId: user._id,
      isActive: true,
      $expr: { $lte: ['$quantity', '$minQuantity'] }
    });
    console.log('Dashboard API: Low stock items:', lowStockProducts);
    
    // Get out of stock products
    console.log('Dashboard API: Counting out of stock items');
    const outOfStockProducts = await Item.countDocuments({
      userId: user._id,
      isActive: true,
      quantity: 0
    });
    console.log('Dashboard API: Out of stock items:', outOfStockProducts);
    
    // Get total inventory value
    console.log('Dashboard API: Calculating total inventory value');
    const products = await Item.find({ userId: user._id, isActive: true }).lean();
    const totalValue = products.reduce((sum: number, product: any) => {
      return sum + (product.quantity * product.price);
    }, 0);
    console.log('Dashboard API: Total inventory value:', totalValue);
    
    // Get recent transactions (last 7 days)
    console.log('Dashboard API: Fetching recent transactions');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTransactions = await Transaction.find({
      userId: user._id,
      createdAt: { $gte: sevenDaysAgo }
    })
    .populate('itemId', 'name sku')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
    console.log('Dashboard API: Recent transactions count:', recentTransactions.length);
    
    // Get transaction counts by type for last 30 days
    console.log('Dashboard API: Fetching monthly transaction stats');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [inTransactions, outTransactions] = await Promise.all([
      Transaction.countDocuments({
        userId: user._id,
        type: 'IN',
        createdAt: { $gte: thirtyDaysAgo }
      }),
      Transaction.countDocuments({
        userId: user._id,
        type: 'OUT',
        createdAt: { $gte: thirtyDaysAgo }
      })
    ]);
    console.log('Dashboard API: Monthly IN transactions:', inTransactions);
    console.log('Dashboard API: Monthly OUT transactions:', outTransactions);
    
    // Get top categories
    console.log('Dashboard API: Fetching category statistics');
    const categoryStats = await Item.aggregate([
      { $match: { userId: user._id, isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    console.log('Dashboard API: Category stats:', categoryStats.length, 'categories');
    
    // Calculate monthly growth (simplified - you can enhance this)
    const monthlyGrowth = 0; // Placeholder - implement actual growth calculation
    
    console.log('Dashboard API: Preparing response data');
    
    // Return data in the format expected by the frontend
    const responseData = {
      totalItems: totalProducts,
      totalValue: Math.round(totalValue * 100) / 100,
      lowStockItems: lowStockProducts,
      outOfStockItems: outOfStockProducts,
      recentTransactions: recentTransactions.length,
      monthlyGrowth: monthlyGrowth,
      // Additional data for future use
      summary: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalValue: Math.round(totalValue * 100) / 100
      },
      recentActivity: {
        recentTransactions,
        monthlyStats: {
          inTransactions,
          outTransactions
        }
      },
      analytics: {
        topCategories: categoryStats
      }
    };
    
    console.log('Dashboard API: Request completed successfully');
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('Dashboard API: Error occurred:', error);
    console.error('Dashboard API: Error stack:', error.stack);
    
    // Handle specific error types
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      console.error('Dashboard API: MongoDB error:', error.message);
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 503 }
      );
    }
    
    if (error.name === 'ValidationError') {
      console.error('Dashboard API: Validation error:', error.message);
      return NextResponse.json(
        { error: 'Data validation error' },
        { status: 400 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 