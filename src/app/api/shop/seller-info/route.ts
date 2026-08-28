import { NextResponse } from 'next/server';
import { Document } from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models';

// GET /api/shop/seller-info - Public: get seller contact info for buyers
export async function GET() {
  try {
    await dbConnect();

    // Find the primary seller (first SUPER_ADMIN)
    const seller = await User.findOne({ role: 'SUPER_ADMIN', isActive: true })
      .select('phone whatsapp telegram instagram shopName shopDescription')
      .lean() as (Document & { phone?: string; whatsapp?: string; telegram?: string; instagram?: string; shopName?: string; shopDescription?: string }) | null;

    if (!seller) {
      return NextResponse.json({
        phone: null,
        whatsapp: null,
        telegram: null,
        instagram: null,
        shopName: 'TKD Store',
        shopDescription: 'Taekwondo Equipment Store',
      });
    }

    return NextResponse.json({
      phone: seller.phone || null,
      whatsapp: seller.whatsapp || null,
      telegram: seller.telegram || null,
      instagram: seller.instagram || null,
      shopName: seller.shopName || 'TKD Store',
      shopDescription: seller.shopDescription || 'Taekwondo Equipment Store',
    });
  } catch (error: unknown) {
    console.error('Error fetching seller info:', error);
    return NextResponse.json({ error: 'Failed to fetch seller info' }, { status: 500 });
  }
}
