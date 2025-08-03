import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  color?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  color: {
    type: String,
    trim: true,
    maxlength: [7, 'Color must be a valid hex color'],
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Allow empty
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex color (e.g., #FF0000)'
    }
  },
  icon: {
    type: String,
    trim: true,
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0,
    min: [0, 'Sort order cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better query performance
CategorySchema.index({ name: 1 });
CategorySchema.index({ userId: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ createdAt: -1 });

// Compound indexes for common queries
CategorySchema.index({ userId: 1, isActive: 1 });
CategorySchema.index({ parentId: 1, isActive: 1 });
CategorySchema.index({ userId: 1, parentId: 1 });

// Text index for search functionality
CategorySchema.index({
  name: 'text',
  description: 'text'
});

// Virtual for full path (including parent categories)
CategorySchema.virtual('fullPath').get(function() {
  // This would need to be populated or calculated separately
  return this.name;
});

// Virtual for item count (would need to be populated)
CategorySchema.virtual('itemCount', {
  ref: 'Item',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Pre-save middleware to ensure unique category names per user
CategorySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    const Category = this.constructor as any;
    const existingCategory = await Category.findOne({
      name: this.name,
      userId: this.userId,
      _id: { $ne: this._id },
      isActive: true
    });
    
    if (existingCategory) {
      const error = new Error('Category name already exists for this user');
      return next(error);
    }
  }
  next();
});

// Instance method to check if category has children
CategorySchema.methods.hasChildren = async function(): Promise<boolean> {
  const Category = this.constructor as any;
  const childCount = await Category.countDocuments({
    parentId: this._id,
    isActive: true
  });
  return childCount > 0;
};

// Instance method to check if category has items
CategorySchema.methods.hasItems = async function(): Promise<boolean> {
  const Item = mongoose.model('Item');
  const itemCount = await Item.countDocuments({
    category: this.name,
    userId: this.userId,
    isActive: true
  });
  return itemCount > 0;
};

// Instance method to get children
CategorySchema.methods.getChildren = function() {
  const Category = this.constructor as any;
  return Category.find({
    parentId: this._id,
    isActive: true
  }).sort({ sortOrder: 1, name: 1 });
};

// Instance method to get all descendants
CategorySchema.methods.getAllDescendants = async function(): Promise<any[]> {
  const Category = this.constructor as any;
  const descendants: any[] = [];
  
  const getDescendants = async (parentId: mongoose.Types.ObjectId) => {
    const children = await Category.find({
      parentId,
      isActive: true
    });
    
    for (const child of children) {
      descendants.push(child);
      await getDescendants(child._id);
    }
  };
  
  await getDescendants(this._id);
  return descendants;
};

// Static method to find root categories
CategorySchema.statics.findRootCategories = function(userId: string) {
  return this.find({
    userId,
    parentId: null,
    isActive: true
  }).sort({ sortOrder: 1, name: 1 });
};

// Static method to find categories by user
CategorySchema.statics.findByUser = function(userId: string) {
  return this.find({
    userId,
    isActive: true
  }).sort({ sortOrder: 1, name: 1 });
};

// Static method to get category tree
CategorySchema.statics.getCategoryTree = async function(userId: string) {
  const categories = await this.find({
    userId,
    isActive: true
  }).sort({ sortOrder: 1, name: 1 });
  
  const buildTree = (parentId: mongoose.Types.ObjectId | null = null) => {
    return categories
      .filter(cat => cat.parentId?.toString() === parentId?.toString())
      .map(cat => ({
        ...cat.toObject(),
        children: buildTree(cat._id)
      }));
  };
  
  return buildTree();
};

// Static method to search categories
CategorySchema.statics.search = function(searchTerm: string, userId: string) {
  return this.find({
    $text: { $search: searchTerm },
    userId,
    isActive: true
  }, {
    score: { $meta: 'textScore' }
  }).sort({ score: { $meta: 'textScore' } });
};

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema); 