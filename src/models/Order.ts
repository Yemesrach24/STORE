import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 'PENDING' | 'APPROVED' | 'DECLINED';

export interface IOrderLineItem {
  source: 'local' | 'imported';
  size?: string;
  quantity: number;
  unitPrice: number;
}

export interface IOrder extends Document {
  // Order identification
  orderNumber: string;
  // Buyer info (snapshot at time of order)
  buyerId?: mongoose.Types.ObjectId;
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerClub?: string;
  // Item info (snapshot at time of order)
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  itemNameAm?: string;
  itemCategory: string;
  itemCategoryAm?: string;
  itemColor?: string;
  itemImage?: string;
  // Line items: multiple source/size/quantity combos per order
  lineItems: IOrderLineItem[];
  // Aggregated totals (sum of all line items)
  totalPrice: number;
  // Company/seller info (snapshot from item at time of order)
  companyName?: string;
  companyNameAm?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  companyTelegram?: string;
  companyInstagram?: string;
  companyEmail?: string;
  // Buyer's message to seller
  message?: string;
  // Status
  status: OrderStatus;
  statusNote?: string;
  orderDate: Date;
  statusUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderLineItemSchema = new Schema<IOrderLineItem>(
  {
    source: {
      type: String,
      enum: { values: ['local', 'imported'], message: 'Source must be local or imported' },
      required: true,
    },
    size: { type: String, trim: true },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false }
);

const OrderSchema: Schema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      trim: true,
      default: '',
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    buyerName: {
      type: String,
      required: [true, 'Buyer name is required'],
      trim: true,
    },
    buyerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    buyerPhone: {
      type: String,
      trim: true,
    },
    buyerClub: {
      type: String,
      trim: true,
      maxlength: [100, 'Club name cannot exceed 100 characters'],
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required'],
      index: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    itemNameAm: {
      type: String,
      trim: true,
    },
    itemCategory: {
      type: String,
      required: [true, 'Item category is required'],
      trim: true,
    },
    itemCategoryAm: {
      type: String,
      trim: true,
    },
    itemColor: {
      type: String,
      trim: true,
    },
    itemImage: {
      type: String,
      trim: true,
    },
    // Multiple line items: each with source, size, quantity, unitPrice
    lineItems: {
      type: [OrderLineItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderLineItem[]) => v.length > 0,
        message: 'At least one line item is required',
      },
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Price cannot be negative'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    companyName: { type: String, trim: true },
    companyNameAm: { type: String, trim: true },
    companyPhone: { type: String, trim: true },
    companyWhatsapp: { type: String, trim: true },
    companyTelegram: { type: String, trim: true },
    companyInstagram: { type: String, trim: true },
    companyEmail: { type: String, trim: true },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'DECLINED'],
        message: 'Status must be PENDING, APPROVED, or DECLINED',
      },
      default: 'PENDING',
      required: true,
      index: true,
    },
    statusNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Status note cannot exceed 500 characters'],
    },
    orderDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    statusUpdatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

// Pre-save: auto-generate order number
OrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Static: find orders by buyer
OrderSchema.statics.findByBuyer = function (buyerId: string) {
  return this.find({ buyerId }).sort({ createdAt: -1 });
};

// Static: find pending orders
OrderSchema.statics.findPending = function () {
  return this.find({ status: 'PENDING' }).sort({ createdAt: -1 });
};

// Static: get order statistics
OrderSchema.statics.getStats = async function (startDate?: Date, endDate?: Date) {
  const match: any = {};
  if (startDate) match.createdAt = { $gte: startDate };
  if (endDate) {
    match.createdAt = match.createdAt || {};
    match.createdAt.$lte = endDate;
  }

  const [statusStats, totalRevenue] = await Promise.all([
    this.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
    ]),
    this.aggregate([
      { $match: { ...match, status: 'APPROVED' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    byStatus: statusStats,
    totalRevenue: totalRevenue[0]?.total || 0,
    totalApproved: totalRevenue[0]?.count || 0,
  };
};

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
