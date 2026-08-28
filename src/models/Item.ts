import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  name: string;
  description: string;
  uniqueNumber: string; // seller-given or auto-generated
  categoryId: mongoose.Types.ObjectId;
  // Variants (optional)
  size?: string;
  color?: string;
  // Pricing & stock
  price: number;
  quantity: number;
  // Company / contact info (shown to buyers)
  companyName?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  companyTelegram?: string;
  companyInstagram?: string;
  companyEmail?: string;
  // Additional info
  supplier?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  imageUrl?: string;
  imageUrls?: string[];
  tags?: string[];
  location?: string;
  // Ownership
  createdBy: mongoose.Types.ObjectId; // admin/super_admin who created
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  uniqueNumber: {
    type: String,
    required: [true, 'Unique number is required'],
    unique: true,
    trim: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true,
  },
  // Variants
  size: {
    type: String,
    trim: true,
    maxlength: [50, 'Size cannot exceed 50 characters'],
  },
  color: {
    type: String,
    trim: true,
    maxlength: [50, 'Color cannot exceed 50 characters'],
  },
  // Pricing & stock
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0,
  },
  // Company / contact info
  companyName: {
    type: String,
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters'],
  },
  companyPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone cannot exceed 20 characters'],
  },
  companyWhatsapp: {
    type: String,
    trim: true,
    maxlength: [50, 'WhatsApp cannot exceed 50 characters'],
  },
  companyTelegram: {
    type: String,
    trim: true,
    maxlength: [50, 'Telegram cannot exceed 50 characters'],
  },
  companyInstagram: {
    type: String,
    trim: true,
    maxlength: [50, 'Instagram cannot exceed 50 characters'],
  },
  companyEmail: {
    type: String,
    trim: true,
    maxlength: [100, 'Email cannot exceed 100 characters'],
  },
  // Additional info
  supplier: {
    type: String,
    trim: true,
    maxlength: [200, 'Supplier cannot exceed 200 characters'],
  },
  stockStatus: {
    type: String,
    enum: {
      values: ['in_stock', 'low_stock', 'out_of_stock'],
      message: 'Stock status must be in_stock, low_stock, or out_of_stock',
    },
    default: 'in_stock',
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  imageUrls: [{
    type: String,
    trim: true,
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
  }],
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters'],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
ItemSchema.index({ name: 1 });
ItemSchema.index({ createdBy: 1 });
ItemSchema.index({ isActive: 1 });
ItemSchema.index({ createdAt: -1 });
ItemSchema.index({ price: 1 });

// Compound indexes
ItemSchema.index({ categoryId: 1, isActive: 1 });
ItemSchema.index({ createdBy: 1, isActive: 1 });

// Text index for search
ItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for category (populate)
ItemSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

// Virtual: total value
ItemSchema.virtual('totalValue').get(function (this: IItem) {
  return this.quantity * this.price;
});

// Pre-save: auto-update stockStatus based on quantity
ItemSchema.pre('save', function (this: IItem, next) {
  if (this.quantity === 0) {
    this.stockStatus = 'out_of_stock';
  } else if (this.quantity <= 5) {
    this.stockStatus = 'low_stock';
  } else {
    this.stockStatus = 'in_stock';
  }
  next();
});

// Static: find by category
ItemSchema.statics.findByCategory = function (categoryId: string) {
  return this.find({ categoryId, isActive: true });
};

// Static: search items
ItemSchema.statics.search = function (searchTerm: string) {
  return this.find(
    { $text: { $search: searchTerm }, isActive: true },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

export default mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);
