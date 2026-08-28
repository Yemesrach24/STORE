import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Order, Item, Category, User } from '@/models';

// GET /api/orders - List orders
// Admin: sees all orders; Customer: sees only their orders
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};

    if (user.role === 'CUSTOMER') {
      query.buyerId = user.dbUserId;
    }
    // Admin/SUPER_ADMIN sees all orders (no filter)

    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders - Place a new order (any authenticated user / customer)
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await getAuthUser();
  } catch (authErr) {
    console.error('Auth error in POST /api/orders:', authErr);
    return NextResponse.json({ error: 'Authentication failed. Please sign in again.' }, { status: 401 });
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { itemId, quantity, message } = body;

    if (!itemId || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'Item ID and valid quantity are required' }, { status: 400 });
    }

    // Fetch item
    let item;
    try {
      item = await Item.findOne({ _id: itemId, isActive: true });
    } catch (itemErr) {
      console.error('Error fetching item:', itemErr);
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }
    if (!item) {
      return NextResponse.json({ error: 'Item not found or unavailable' }, { status: 404 });
    }

    // Stock is decremented when order is APPROVED, not on creation.
    // Just check sufficient stock exists.
    if (item.quantity < quantity) {
      return NextResponse.json({ error: `Insufficient stock. Only ${item.quantity} available.` }, { status: 400 });
    }

    // Fetch category name for snapshot
    let category = null;
    try {
      category = await Category.findById(item.categoryId);
    } catch {
      // Category fetch failure is non-critical
    }

    // Get buyer info
    const buyer = await User.findOne({ authId: user.userId }).catch(() => null);

    // Generate order number before save to satisfy validation
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const orderCount = await Order.countDocuments();
    const orderNum = `ORD-${dateStr}-${String(orderCount + 1).padStart(4, '0')}`;

    const order = new Order({
      orderNumber: orderNum,
      buyerId: buyer?._id || user.dbUserId,
      buyerName: user.name,
      buyerEmail: user.email,
      buyerPhone: buyer?.phone || undefined,
      itemId: item._id,
      itemName: item.name,
      itemCategory: category?.name || 'Unknown',
      itemSize: item.size || undefined,
      itemColor: item.color || undefined,
      itemImage: item.imageUrl || undefined,
      quantity,
      unitPrice: item.price || 0,
      totalPrice: (item.price || 0) * quantity,
      companyName: item.companyName || undefined,
      companyPhone: item.companyPhone || undefined,
      companyWhatsapp: item.companyWhatsapp || undefined,
      companyTelegram: item.companyTelegram || undefined,
      companyInstagram: item.companyInstagram || undefined,
      companyEmail: item.companyEmail || undefined,
      message: message || undefined,
      status: 'PENDING',
    });

    await order.save();

    // Notify seller via Telegram (fire and forget)
    notifySellerTelegram(order).catch(console.error);

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Error placing order:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
  }
}

// Helper: notify seller via Telegram when new order arrives
async function notifySellerTelegram(order: any) {
  try {
    const seller = await User.findOne({ role: 'SUPER_ADMIN', isActive: true });
    // Use telegramChatId (numeric chat ID) for notifications, not telegram (username)
    const chatId = seller?.telegramChatId;
    if (!chatId) {
      console.warn('No Telegram chat ID configured for seller. Seller needs to set it up at /admin/telegram');
      return;
    }

    const { sendTelegramMessage } = await import('@/lib/telegram');
    await sendTelegramMessage(
      chatId,
      [
        `🛒 <b>New Order Received!</b>`,
        ``,
        `<b>Order:</b> #${order.orderNumber}`,
        `<b>Item:</b> ${order.itemName}`,
        `<b>Category:</b> ${order.itemCategory}`,
        `<b>Qty:</b> ${order.quantity} × Br ${order.unitPrice} = <b>Br ${order.totalPrice}</b>`,
        ``,
        `<b>Buyer:</b> ${order.buyerName}`,
        `<b>Email:</b> ${order.buyerEmail}`,
        order.message ? `<b>Message:</b> ${order.message}` : '',
        ``,
        `⚡ Log in to your dashboard to approve or decline this order.`,
      ].filter(Boolean).join('\n'),
      'HTML'
    );
  } catch (error) {
    console.error('Telegram notification failed:', error);
  }
}
