import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import { Item, User } from '@/models';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Get user from database
    const user = await User.findOne({ clerkId: userId, isActive: true });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const category = searchParams.get('category');
    const stockFilter = searchParams.get('stockFilter');

    // Build query
    const query: any = { 
      userId: user._id,
      isActive: true 
    };
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Stock filters
    if (stockFilter === 'in-stock') {
      query.quantity = { $gt: 0 };
    } else if (stockFilter === 'out-of-stock') {
      query.quantity = 0;
    } else if (stockFilter === 'low-stock') {
      query.$expr = { $lte: ['$quantity', '$minQuantity'] };
    }

    // Get all items matching the query
    const items = await Item.find(query).lean();

    if (format === 'csv') {
      return exportToCSV(items);
    } else if (format === 'pdf') {
      return exportToPDF(items);
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use csv or pdf.' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error exporting items:', error);
    return NextResponse.json(
      { error: 'Failed to export items' },
      { status: 500 }
    );
  }
}

function exportToCSV(items: any[]) {
  const headers = [
    'Name',
    'SKU',
    'Category',
    'Description',
    'Quantity',
    'Unit',
    'Price',
    'Cost Price',
    'Total Value',
    'Min Quantity',
    'Max Quantity',
    'Location',
    'Supplier',
    'Status',
    'Created At',
    'Updated At'
  ];

  const csvContent = [
    headers.join(','),
    ...items.map((item) => [
      `"${item.name}"`,
      item.sku || '',
      `"${item.category}"`,
      `"${item.description}"`,
      item.quantity,
      item.unit,
      item.price,
      item.costPrice,
      (item.quantity * item.price).toFixed(2),
      item.minQuantity,
      item.maxQuantity,
      `"${item.location || ''}"`,
      `"${item.supplier || ''}"`,
      getStockStatus(item),
      new Date(item.createdAt).toLocaleDateString(),
      new Date(item.updatedAt).toLocaleDateString()
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8;' });
  
  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

function exportToPDF(items: any[]) {
  // For PDF export, we'll return a JSON response with the data
  // In a real implementation, you would use a library like jsPDF or puppeteer
  const pdfData = {
    title: 'Inventory Report',
    generatedAt: new Date().toISOString(),
    totalItems: items.length,
    totalValue: items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
    items: items.map(item => ({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
      totalValue: item.quantity * item.price,
      status: getStockStatus(item)
    }))
  };

  return NextResponse.json(pdfData, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}

function getStockStatus(item: any): string {
  if (item.quantity === 0) {
    return 'Out of Stock';
  }
  if (item.quantity <= item.minQuantity) {
    return 'Low Stock';
  }
  return 'In Stock';
} 