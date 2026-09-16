import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Order, Item, Category, User } from '@/models';

// GET /api/orders - List orders
// Admin: sees all orders; Customer: sees only their orders.
// Guests (no session) see their own orders via the `guest_id` httpOnly cookie.
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    let user: Awaited<ReturnType<typeof getAuthUser>> = null;
    try {
      user = await getAuthUser();
    } catch {
      user = null;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};

    if (user) {
      // Signed-in customer: only their own orders.
      if (user.role === 'CUSTOMER') {
        query.buyerId = user.dbUserId;
      }
      // Admin/SUPER_ADMIN sees all orders (no filter)
    } else {
      // Guest: resolve their record via the `guest_id` cookie (phone-keyed).
      const guestId = request.cookies.get('guest_id')?.value;
      if (!guestId) {
        return NextResponse.json({ error: 'Please sign in or place an order first' }, { status: 401 });
      }
      const guestUser = await User.findOne({ authId: guestId }).catch(() => null);
      if (!guestUser) {
        return NextResponse.json({ error: 'Order history not found. Please sign in.' }, { status: 401 });
      }
      query.buyerId = guestUser._id;
    }

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

// POST /api/orders - Place a new order (guests allowed: name/phone/club required)
export async function POST(request: NextRequest) {
  // Optional auth — guests can order without signing in.
  let user: Awaited<ReturnType<typeof getAuthUser>> = null;
  try {
    user = await getAuthUser();
  } catch {
    user = null;
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { itemId, lineItems, message, buyerName, buyerPhone, buyerClub, buyerEmail } = body;

    if (!itemId || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: 'Item ID and at least one line item are required' }, { status: 400 });
    }

    // Validate each line item has source and quantity
    for (const li of lineItems) {
      if (!li.source || !['local', 'imported'].includes(li.source)) {
        return NextResponse.json({ error: 'Each line item must have a valid source (local or imported)' }, { status: 400 });
      }
      if (!li.quantity || li.quantity < 1) {
        return NextResponse.json({ error: 'Each line item must have quantity >= 1' }, { status: 400 });
      }
    }

    // Guest checkout requires name + phone + club (admins/customers reuse session info)
    const name = buyerName?.trim() || user?.name || '';
    const phone = buyerPhone?.trim() || '';
    const club = buyerClub?.trim() || '';
    const email = buyerEmail?.trim() || user?.email || '';

    if (!user) {
      if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
      if (!club) return NextResponse.json({ error: 'Club name is required' }, { status: 400 });
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

    // Validate that the requested sources are enabled on the item
    for (const li of lineItems) {
      const src = li.source as 'local' | 'imported';
      if (!item[src]?.enabled) {
        return NextResponse.json({ error: `Source "${src}" is not available for this item` }, { status: 400 });
      }
    }

    // Validate sizes and compute unit prices from item's stored pricing
    const validatedLineItems: { source: 'local' | 'imported'; size?: string; quantity: number; unitPrice: number }[] = [];
    for (const li of lineItems) {
      const src = li.source as 'local' | 'imported';
      const sourceData = item[src];
      let unitPrice = sourceData.basePrice;
      if (li.size) {
        const sz = sourceData.sizes.find((s: any) => s.name === li.size);
        if (sz) {
          unitPrice = sz.price != null ? sz.price : sourceData.basePrice;
        }
      } else if (sourceData.sizes.length > 0) {
        // Item has sizes but client didn't specify one — error
        return NextResponse.json({ error: 'Size is required when the item has sizes' }, { status: 400 });
      }
      validatedLineItems.push({
        source: src,
        size: li.size || undefined,
        quantity: li.quantity,
        unitPrice,
      });
    }

    // Compute total price
    const totalPrice = validatedLineItems.reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);

    // Fetch category name for snapshot
    let category = null;
    try {
      category = await Category.findById(item.categoryId);
    } catch {
      // Category fetch failure is non-critical
    }

    // Resolve buyer. For signed-in users, use their account.
    // For guests, reuse an existing guest record by phone or auto-create one.
    let buyer = null;
    let guestAuthId = '';
    if (user) {
      buyer = await User.findOne({ authId: user.userId }).catch(() => null);
      if (buyer && club) {
        buyer.club = club;
        await buyer.save().catch(() => {});
      }
    } else {
      guestAuthId = `guest-${phone.replace(/[^0-9a-zA-Z]/g, '')}`;
      buyer = await User.findOne({ authId: guestAuthId }).catch(() => null);
      if (!buyer) {
        const nameParts = name.trim().split(/\s+/);
        try {
          buyer = await User.create({
            authId: guestAuthId,
            name: name.trim(),
            email: `${guestAuthId}@guest.local`,
            firstName: nameParts[0] || 'Guest',
            lastName: nameParts.slice(1).join(' ') || 'Customer',
            role: 'CUSTOMER',
            isActive: true,
            phone: phone,
            club: club,
            currency: 'ETB',
          });
        } catch (createErr: any) {
          // Race: another request created the same guest — re-fetch
          if (createErr?.code === 11000) {
            buyer = await User.findOne({ authId: guestAuthId }).catch(() => null);
          }
          if (!buyer) {
            console.error('Failed to create guest user:', createErr);
            return NextResponse.json({ error: 'Failed to record buyer information' }, { status: 500 });
          }
        }
      } else {
        // Update existing guest record with latest contact info
        if (name) buyer.name = name.trim();
        if (phone) buyer.phone = phone;
        if (club) buyer.club = club;
        await buyer.save().catch(() => {});
      }
    }

    // Generate order number before save to satisfy validation
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const orderCount = await Order.countDocuments();
    const orderNum = `ORD-${dateStr}-${String(orderCount + 1).padStart(4, '0')}`;

    const order = new Order({
      orderNumber: orderNum,
      buyerId: buyer?._id || user?.dbUserId,
      buyerName: name || buyer?.name || user?.name,
      buyerEmail: email || buyer?.email || undefined,
      buyerPhone: phone || buyer?.phone || undefined,
      buyerClub: club || buyer?.club || undefined,
      itemId: item._id,
      itemName: item.name,
      itemNameAm: item.nameAm || undefined,
      itemCategory: category?.name || 'Unknown',
      itemCategoryAm: category?.nameAm || undefined,
      itemColor: item.color || undefined,
      itemImage: item.imageUrl || undefined,
      lineItems: validatedLineItems,
      totalPrice,
      companyName: item.companyName || undefined,
      companyNameAm: item.companyNameAm || undefined,
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

    // For guests, set an httpOnly cookie so "My Orders" can identify them
    // on subsequent requests (no localStorage, no Google sign-in).
    if (!user) {
      const res = NextResponse.json(order, { status: 201 });
      res.cookies.set('guest_id', guestAuthId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
      return res;
    }

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
    const am = seller.language === 'am';

    // Build a human-readable line-items summary for Telegram
    const lineSummary = (order.lineItems || [])
      .map((li: any) => `  ${li.source === 'local' ? 'Local' : 'Imported'} ${li.size ? li.size + ' × ' : ''}${li.quantity} @ Br ${li.unitPrice}`)
      .join('\n');

    const msg = am
      ? [
          `🛒 <b>አዲስ ትዕዛዝ ደርሷል!</b>`,
          ``,
          `<b>ትዕዛዝ:</b> #${order.orderNumber}`,
          `<b>ዕቃ:</b> ${order.itemName}`,
          `<b>ምድብ:</b> ${order.itemCategory}`,
          `<b>ዝርዝር:</b>\n${lineSummary}`,
          `<b>ጠቅላላ:</b> <b>Br ${order.totalPrice}</b>`,
          ``,
          `<b>ገዢ:</b> ${order.buyerName}`,
          order.buyerPhone ? `<b>ስልክ:</b> ${order.buyerPhone}` : '',
          order.buyerClub ? `<b>ክለብ:</b> ${order.buyerClub}` : '',
          order.buyerEmail ? `<b>ኢሜይል:</b> ${order.buyerEmail}` : '',
          order.message ? `<b>መልዕክት:</b> ${order.message}` : '',
          ``,
          `⚡ ትዕዛዙን ለማጽደቅ ወይም ለመግቀል ወደ ዳሽቦርድዎ ይግቡ።`,
        ]
      : [
          `🛒 <b>New Order Received!</b>`,
          ``,
          `<b>Order:</b> #${order.orderNumber}`,
          `<b>Item:</b> ${order.itemName}`,
          `<b>Category:</b> ${order.itemCategory}`,
          `<b>Details:</b>\n${lineSummary}`,
          `<b>Total:</b> <b>Br ${order.totalPrice}</b>`,
          ``,
          `<b>Buyer:</b> ${order.buyerName}`,
          order.buyerPhone ? `<b>Phone:</b> ${order.buyerPhone}` : '',
          order.buyerClub ? `<b>Club:</b> ${order.buyerClub}` : '',
          order.buyerEmail ? `<b>Email:</b> ${order.buyerEmail}` : '',
          order.message ? `<b>Message:</b> ${order.message}` : '',
          ``,
          `⚡ Log in to your dashboard to approve or decline this order.`,
        ];
    await sendTelegramMessage(chatId, msg.filter(Boolean).join('\n'), 'HTML');
  } catch (error) {
    console.error('Telegram notification failed:', error);
  }
}
