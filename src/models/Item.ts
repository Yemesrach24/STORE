import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
  userId: mongoose.Types.ObjectId;
  sku?: string;
  barcode?: string;
  unit: string;
  minQuantity: number;
  maxQuantity: number;
  location?: string;
  supplier?: string;
  costPrice: number;
  isActive: boolean;
  tags?: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0,
    index: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v: number) {
        return v >= 0;
      },
      message: 'Price must be a positive number'
    }
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters'],
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  sku: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [50, 'SKU cannot exceed 50 characters'],
    unique: true,
    sparse: true, // Allows multiple null values
    index: true
  },
  barcode: {
    type: String,
    trim: true,
    maxlength: [100, 'Barcode cannot exceed 100 characters'],
    unique: true,
    sparse: true,
    index: true
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters'],
    enum: {
      values: ['pieces', 'boxes', 'kg', 'liters', 'meters', 'pairs', 'sets', 'units'],
      message: 'Unit must be one of: pieces, boxes, kg, liters, meters, pairs, sets, units'
    }
  },
  minQuantity: {
    type: Number,
    required: [true, 'Minimum quantity is required'],
    min: [0, 'Minimum quantity cannot be negative'],
    default: 0
  },
  maxQuantity: {
    type: Number,
    required: [true, 'Maximum quantity is required'],
    min: [0, 'Maximum quantity cannot be negative'],
    validate: {
      validator: function(this: any, v: number) {
        return v >= this.minQuantity;
      },
      message: 'Maximum quantity must be greater than or equal to minimum quantity'
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  supplier: {
    type: String,
    trim: true,
    maxlength: [200, 'Supplier cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better query performance
ItemSchema.index({ name: 1 });
ItemSchema.index({ category: 1 });
ItemSchema.index({ userId: 1 });
ItemSchema.index({ isActive: 1 });
ItemSchema.index({ quantity: 1 });
ItemSchema.index({ price: 1 });
ItemSchema.index({ createdAt: -1 });
ItemSchema.index({ updatedAt: -1 });

// Compound indexes for common queries
ItemSchema.index({ userId: 1, isActive: 1 });
ItemSchema.index({ category: 1, isActive: 1 });
ItemSchema.index({ userId: 1, category: 1 });
ItemSchema.index({ quantity: 1, isActive: 1 });
ItemSchema.index({ name: 1, isActive: 1 });

// Text index for search functionality
ItemSchema.index({
  name: 'text',
  description: 'text',
  category: 'text',
  tags: 'text'
});

// Virtual for total value
ItemSchema.virtual('totalValue').get(function() {
  return this.quantity * this.price;
});

// Virtual for profit margin
ItemSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.price - this.costPrice) / this.costPrice) * 100;
});

// Virtual for stock status
ItemSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.minQuantity) return 'low_stock';
  if (this.quantity >= this.maxQuantity) return 'overstocked';
  return 'normal';
});

// Virtual for stock percentage
ItemSchema.virtual('stockPercentage').get(function() {
  if (this.maxQuantity === 0) return 0;
  return (this.quantity / this.maxQuantity) * 100;
});

// Pre-save middleware to validate data
ItemSchema.pre('save', function(next) {
  // Ensure SKU is unique if provided
  if (this.sku) {
    this.sku = this.sku.toUpperCase();
  }
  
  // Ensure barcode is unique if provided
  if (this.barcode) {
    this.barcode = this.barcode.trim();
  }
  
  next();
});

// Pre-save middleware to check for duplicate SKU/barcode
ItemSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('sku') || this.isModified('barcode')) {
    const Item = this.constructor as any;
    const query: any = { _id: { $ne: this._id } };
    
    if (this.sku) {
      query.sku = this.sku;
    }
    
    if (this.barcode) {
      query.barcode = this.barcode;
    }
    
    const existingItem = await Item.findOne(query);
    if (existingItem) {
      const error = new Error('SKU or barcode already exists');
      return next(error);
    }
  }
  next();
});

// Instance method to check if item is low stock
ItemSchema.methods.isLowStock = function(): boolean {
  return this.quantity <= this.minQuantity;
};

// Instance method to check if item is out of stock
ItemSchema.methods.isOutOfStock = function(): boolean {
  return this.quantity === 0;
};

// Instance method to check if item is overstocked
ItemSchema.methods.isOverstocked = function(): boolean {
  return this.quantity >= this.maxQuantity;
};

// Instance method to update quantity
ItemSchema.methods.updateQuantity = function(newQuantity: number) {
  if (newQuantity < 0) {
    throw new Error('Quantity cannot be negative');
  }
  this.quantity = newQuantity;
  return this.save();
};

// Instance method to add quantity
ItemSchema.methods.addQuantity = function(amount: number) {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  this.quantity += amount;
  return this.save();
};

// Instance method to remove quantity
ItemSchema.methods.removeQuantity = function(amount: number) {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  if (this.quantity < amount) {
    throw new Error('Insufficient stock');
  }
  this.quantity -= amount;
  return this.save();
};

// Static method to find low stock items
ItemSchema.statics.findLowStock = function() {
  return this.find({
    $expr: { $lte: ['$quantity', '$minQuantity'] },
    isActive: true
  });
};

// Static method to find out of stock items
ItemSchema.statics.findOutOfStock = function() {
  return this.find({ quantity: 0, isActive: true });
};

// Static method to find items by category
ItemSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true });
};

// Static method to find items by user
ItemSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId, isActive: true });
};

// Static method to search items
ItemSchema.statics.search = function(searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm },
    isActive: true
  }, {
    score: { $meta: 'textScore' }
  }).sort({ score: { $meta: 'textScore' } });
};

// Static method to get inventory value
ItemSchema.statics.getInventoryValue = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);
};

export default mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema); 