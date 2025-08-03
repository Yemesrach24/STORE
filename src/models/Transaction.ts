import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  itemId: mongoose.Types.ObjectId;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  reference?: string;
  notes?: string;
  userId: mongoose.Types.ObjectId;
  location?: string;
  cost?: number;
  supplier?: string;
  customer?: string;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: {
      values: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'],
      message: 'Transaction type must be IN, OUT, ADJUSTMENT, or TRANSFER'
    },
    required: [true, 'Transaction type is required'],
    index: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity must be positive'],
    validate: {
      validator: function(v: number) {
        return v > 0;
      },
      message: 'Quantity must be greater than 0'
    }
  },
  previousQuantity: {
    type: Number,
    required: [true, 'Previous quantity is required'],
    min: [0, 'Previous quantity cannot be negative']
  },
  newQuantity: {
    type: Number,
    required: [true, 'New quantity is required'],
    min: [0, 'New quantity cannot be negative']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [200, 'Reason cannot exceed 200 characters']
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  supplier: {
    type: String,
    trim: true,
    maxlength: [200, 'Supplier cannot exceed 200 characters']
  },
  customer: {
    type: String,
    trim: true,
    maxlength: [200, 'Customer cannot exceed 200 characters']
  },
  transactionDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better query performance
TransactionSchema.index({ itemId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ transactionDate: -1 });
TransactionSchema.index({ createdAt: -1 });

// Compound indexes for common queries
TransactionSchema.index({ itemId: 1, type: 1 });
TransactionSchema.index({ userId: 1, transactionDate: -1 });
TransactionSchema.index({ itemId: 1, transactionDate: -1 });
TransactionSchema.index({ type: 1, transactionDate: -1 });

// Text index for search functionality
TransactionSchema.index({
  reason: 'text',
  notes: 'text',
  reference: 'text'
});

// Virtual for quantity change
TransactionSchema.virtual('quantityChange').get(function() {
  return this.newQuantity - this.previousQuantity;
});

// Virtual for absolute quantity change
TransactionSchema.virtual('absoluteQuantityChange').get(function() {
  return Math.abs(this.quantityChange);
});

// Virtual for transaction value
TransactionSchema.virtual('transactionValue').get(function() {
  return this.quantity * (this.cost || 0);
});

// Pre-save middleware to validate transaction
TransactionSchema.pre('save', function(next) {
  // Validate quantity changes based on transaction type
  if (this.type === 'IN') {
    if (this.newQuantity !== this.previousQuantity + this.quantity) {
      return next(new Error('Invalid quantity calculation for IN transaction'));
    }
  } else if (this.type === 'OUT') {
    if (this.newQuantity !== this.previousQuantity - this.quantity) {
      return next(new Error('Invalid quantity calculation for OUT transaction'));
    }
    if (this.previousQuantity < this.quantity) {
      return next(new Error('Insufficient stock for OUT transaction'));
    }
  } else if (this.type === 'ADJUSTMENT') {
    if (this.newQuantity !== this.quantity) {
      return next(new Error('Invalid quantity calculation for ADJUSTMENT transaction'));
    }
  }
  
  next();
});

// Instance method to get transaction summary
TransactionSchema.methods.getSummary = function() {
  return {
    type: this.type,
    quantity: this.quantity,
    quantityChange: this.quantityChange,
    reason: this.reason,
    date: this.transactionDate,
    value: this.transactionValue
  };
};

// Static method to find transactions by item
TransactionSchema.statics.findByItem = function(itemId: string, options: any = {}) {
  const query: any = { itemId };
  
  if (options.type) query.type = options.type;
  if (options.startDate) query.transactionDate = { $gte: options.startDate };
  if (options.endDate) {
    if (query.transactionDate) {
      query.transactionDate.$lte = options.endDate;
    } else {
      query.transactionDate = { $lte: options.endDate };
    }
  }
  
  return this.find(query)
    .populate('itemId', 'name sku category')
    .populate('userId', 'name email')
    .sort({ transactionDate: -1, createdAt: -1 });
};

// Static method to find transactions by user
TransactionSchema.statics.findByUser = function(userId: string, options: any = {}) {
  const query: any = { userId };
  
  if (options.type) query.type = options.type;
  if (options.startDate) query.transactionDate = { $gte: options.startDate };
  if (options.endDate) {
    if (query.transactionDate) {
      query.transactionDate.$lte = options.endDate;
    } else {
      query.transactionDate = { $lte: options.endDate };
    }
  }
  
  return this.find(query)
    .populate('itemId', 'name sku category')
    .sort({ transactionDate: -1, createdAt: -1 });
};

// Static method to get transaction statistics
TransactionSchema.statics.getStatistics = function(options: any = {}) {
  const matchStage: any = {};
  
  if (options.userId) matchStage.userId = options.userId;
  if (options.itemId) matchStage.itemId = options.itemId;
  if (options.type) matchStage.type = options.type;
  if (options.startDate) matchStage.transactionDate = { $gte: options.startDate };
  if (options.endDate) {
    if (matchStage.transactionDate) {
      matchStage.transactionDate.$lte = options.endDate;
    } else {
      matchStage.transactionDate = { $lte: options.endDate };
    }
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$cost', 0] }] } }
      }
    }
  ]);
};

// Static method to get recent transactions
TransactionSchema.statics.getRecentTransactions = function(limit: number = 10) {
  return this.find()
    .populate('itemId', 'name sku category')
    .populate('userId', 'name email')
    .sort({ transactionDate: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to search transactions
TransactionSchema.statics.search = function(searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm }
  }, {
    score: { $meta: 'textScore' }
  })
  .populate('itemId', 'name sku category')
  .populate('userId', 'name email')
  .sort({ score: { $meta: 'textScore' } });
};

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema); 