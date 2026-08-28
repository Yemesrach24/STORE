import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import dbConnect from '@/lib/mongodb';
import { Order, User, Item } from '@/models';

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

// PUT /api/orders/[id] - Update order status (admin only)
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
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    }
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can update orders' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { status, statusNote } = body;

    if (!status || !['APPROVED', 'DECLINED', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be APPROVED, DECLINED, or PENDING' },
        { status: 400 }
      );
    }

    // Fetch the current order first
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Stock management:
    // - APPROVE: decrement stock (stock was NOT decremented on order creation)
    // - DECLINE from non-DECLINED: restore stock
    // - DECLINE from APPROVED: restore stock
    // - PENDING from APPROVED: restore stock (revert approval)
    if (status === 'APPROVED' && existingOrder.status !== 'APPROVED') {
      // Approving: decrement stock
      const updated = await Item.findOneAndUpdate(
        { _id: existingOrder.itemId, quantity: { $gte: existingOrder.quantity } },
        { $inc: { quantity: -existingOrder.quantity } },
        { new: true }
      ).catch((e: any) => { console.error('Stock decrement failed:', e); return null; });
      if (!updated) {
        return NextResponse.json({ error: 'Insufficient stock to approve this order' }, { status: 400 });
      }
    } else if (status === 'DECLINED' && existingOrder.status !== 'DECLINED') {
      // Declining: restore stock only if it was previously APPROVED
      if (existingOrder.status === 'APPROVED') {
        await Item.findByIdAndUpdate(
          existingOrder.itemId,
          { $inc: { quantity: existingOrder.quantity } }
        ).catch((e: any) => console.error('Stock restore failed:', e));
      }
    } else if (status === 'PENDING' && existingOrder.status === 'APPROVED') {
      // Reverting from APPROVED to PENDING: restore stock
      await Item.findByIdAndUpdate(
        existingOrder.itemId,
        { $inc: { quantity: existingOrder.quantity } }
      ).catch((e: any) => console.error('Stock restore failed:', e));
    }

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status,
        statusNote: statusNote || '',
        statusUpdatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Notify buyer about status change via Telegram
    try {
      const buyer = await User.findById(updatedOrder.buyerId);
      if (buyer?.telegramChatId) {
        const { sendTelegramMessage } = await import('@/lib/telegram');
        const statusEmoji = status === 'APPROVED' ? '✅' : status === 'DECLINED' ? '❌' : '⏳';
        const msg = [
          `${statusEmoji} <b>Order #${updatedOrder.orderNumber}</b> has been <b>${status}</b>`,
          statusNote ? `📝 Note: ${statusNote}` : '',
          '',
          status === 'APPROVED'
            ? '✅ Contact the seller to arrange payment and delivery.'
            : status === 'DECLINED'
            ? '❌ Your order was declined. Contact the seller for more info.'
            : '⏳ Your order is pending review.',
        ].filter(Boolean).join('\n');
        await sendTelegramMessage(buyer.telegramChatId, msg, 'HTML');
      }
    } catch (e) {
      console.error('Telegram buyer notification failed:', e);
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
