import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Order, Item, User } from '@/models';
import { parsePriceToNumber } from '@/lib/price';

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const query: any = { _id: id };
    // Customers can only see their own orders
    if (user.role === 'CUSTOMER') {
      const buyer = await User.findOne({ authId: user.userId });
      query.buyerId = buyer?._id || user.dbUserId;
    }

    const order = await Order.findOne(query).lean();
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

// PUT /api/orders/[id] - Update order
// Admins: can change status, statusNote, lineItems (quantities), message.
// Buyer (signed-in customer or guest via guest_id cookie): can edit their own
// PENDING order's line-item quantities and message.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user;
    try {
      user = await getAuthUser();
    } catch (authErr) {
      console.error('Auth error in PUT /api/orders:', authErr);
      user = null;
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { status, statusNote, lineItems, message } = body;

    // Resolve guest identity (guest checkout uses the guest_id cookie)
    let guestDbUserId: string | null = null;
    if (!user) {
      const guestId = request.cookies.get('guest_id')?.value;
      if (guestId) {
        const guestUser = await User.findOne({ authId: guestId }).catch(() => null);
        if (guestUser) guestDbUserId = (guestUser._id as any).toString();
      }
    }

    const isAdmin = !!user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN');

    // Fetch the current order first
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const ownerId = existingOrder.buyerId?.toString();
    const isOwner =
      (!!user && !!user.dbUserId && ownerId === user.dbUserId) ||
      (!!guestDbUserId && ownerId === guestDbUserId);

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    }

    // Buyers may only touch their own PENDING orders, and only quantities + message
    if (!isAdmin) {
      if (existingOrder.status !== 'PENDING') {
        return NextResponse.json({ error: 'Only pending orders can be edited' }, { status: 400 });
      }
      if (status !== undefined || statusNote !== undefined) {
        return NextResponse.json({ error: 'Only admins can update order status' }, { status: 403 });
      }
    }

    if (status && !['APPROVED', 'DECLINED', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be APPROVED, DECLINED, or PENDING' },
        { status: 400 }
      );
    }

    // Build update fields
    const updateFields: Record<string, any> = {
      statusUpdatedAt: new Date(),
    };
    if (isAdmin) {
      updateFields.statusNote = statusNote || '';
      if (status) updateFields.status = status;
      if (message !== undefined) updateFields.message = message || undefined;
    } else if (message !== undefined) {
      updateFields.message = message || undefined;
    }

    // Handle lineItems (quantity) updates
    if (Array.isArray(lineItems) && lineItems.length > 0) {
      // Validate line items
      for (const li of lineItems) {
        if (!li.source || !['local', 'imported'].includes(li.source)) {
          return NextResponse.json({ error: 'Invalid line item source' }, { status: 400 });
        }
        if (!li.quantity || li.quantity < 1) {
          return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
        }
      }
      // Recompute unit prices from the item's current pricing so buyers
      // cannot tamper with prices (also resolves free-text prices like "300-700").
      try {
        const item = await Item.findById(existingOrder.itemId).lean().catch(() => null);
        if (item) {
          for (const li of lineItems) {
            const src = (item as any)[li.source];
            if (!src?.enabled) {
              return NextResponse.json({ error: `Source "${li.source}" is not available for this item` }, { status: 400 });
            }
            let unitPrice = parsePriceToNumber(src.basePrice);
            if (li.size) {
              const sz = (src.sizes || []).find((s: any) => s.name === li.size);
              if (sz) unitPrice = parsePriceToNumber(sz.price != null && sz.price !== '' ? sz.price : src.basePrice);
            }
            li.unitPrice = unitPrice;
            // Drop client-controlled extras
            delete (li as any)._id;
          }
        }
      } catch {
        // If item lookup fails, keep client unit prices (admin flow)
      }
      updateFields.lineItems = lineItems;
      // Recalculate total price from line items
      updateFields.totalPrice = lineItems.reduce((sum: number, li: any) => sum + (li.unitPrice || 0) * (li.quantity || 0), 0);
    }

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Notify buyer about status change via Telegram (admin status changes only)
    if (status) {
    try {
      const buyer = await User.findById(updatedOrder.buyerId);
      if (buyer?.telegramChatId) {
        const { sendTelegramMessage } = await import('@/lib/telegram');
        const statusEmoji = status === 'APPROVED' ? '✅' : status === 'DECLINED' ? '❌' : '⏳';
        const buyerLang = buyer.language === 'am' ? 'am' : buyer.language === 'ko' ? 'ko' : 'en';
        const msg = buyerLang === 'am'
          ? [
              `${statusEmoji} <b>ትዕዛዝ #${updatedOrder.orderNumber}</b> ወደ <b>${status}</b> ተቀይሯል`,
              statusNote ? `📝 ማስታወሻ: ${statusNote}` : '',
              '',
              status === 'APPROVED'
                ? '✅ ክፍያና አቅርቦትን ለማስተባበር ሻጩን ያግኙ።'
                : status === 'DECLINED'
                ? '❌ ትዕዛዝዎ ተግቷል። ለበለጠ መረጃ ሻጩን ያግኙ።'
                : '⏳ ትዕዛዝዎ በመጠባበቅ ላይ ነው።',
            ]
          : buyerLang === 'ko'
          ? [
              `${statusEmoji} <b>주문 #${updatedOrder.orderNumber}</b> 상태가 <b>${status}</b>(으)로 변경되었습니다`,
              statusNote ? `📝 메모: ${statusNote}` : '',
              '',
              status === 'APPROVED'
                ? '✅ 결제와 배송 협의를 위해 판매자에게 연락하세요.'
                : status === 'DECLINED'
                ? '❌ 주문이 거절되었습니다. 자세한 내용은 판매자에게 문의하세요.'
                : '⏳ 주문이 검토 대기 중입니다.',
            ]
          : [
              `${statusEmoji} <b>Order #${updatedOrder.orderNumber}</b> has been <b>${status}</b>`,
              statusNote ? `📝 Note: ${statusNote}` : '',
              '',
              status === 'APPROVED'
                ? '✅ Contact the seller to arrange payment and delivery.'
                : status === 'DECLINED'
                ? '❌ Your order was declined. Contact the seller for more info.'
                : '⏳ Your order is pending review.',
            ];
        await sendTelegramMessage(buyer.telegramChatId, msg.filter(Boolean).join('\n'), 'HTML');
      }
    } catch (e) {
      console.error('Telegram buyer notification failed:', e);
    }
    }

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}

// DELETE /api/orders/[id] - Delete a PENDING order (buyer only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user;
    try {
      user = await getAuthUser();
    } catch (authErr) {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only the buyer can delete their own PENDING order
    const isOwner = order.buyerId?.toString() === user.dbUserId;
    if (!isOwner && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    if (order.status !== 'PENDING' && user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Only pending orders can be deleted' }, { status: 400 });
    }

    await Order.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
