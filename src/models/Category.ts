import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  nameAm?: string;
  description?: string;
  descriptionAm?: string;
  imageUrl?: string;
  parentId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
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
  },
  nameAm: {
    type: String,
    trim: true,
    maxlength: [100, 'Amharic category name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  descriptionAm: {
    type: String,
    trim: true,
    maxlength: [500, 'Amharic description cannot exceed 500 characters'],
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
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
  sortOrder: {
    type: Number,
    default: 0,
    min: [0, 'Sort order cannot be negative'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ createdBy: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ sortOrder: 1 });

// Compound indexes
CategorySchema.index({ createdBy: 1, isActive: 1 });
CategorySchema.index({ parentId: 1, isActive: 1 });

// Text index
CategorySchema.index({ name: 'text', description: 'text' });

// Virtual: children
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

// Virtual: item count
CategorySchema.virtual('itemCount', {
  ref: 'Item',
  localField: '_id',
  foreignField: 'categoryId',
  count: true,
});

// Pre-save: ensure unique category names per creator
CategorySchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('name')) {
    const Category = this.constructor as any;
    const existing = await Category.findOne({
      name: this.name,
      createdBy: this.createdBy,
      _id: { $ne: this._id },
      isActive: true,
    });
    if (existing) {
      return next(new Error('Category name already exists'));
    }
  }
  next();
});

// Static: find root categories
CategorySchema.statics.findRootCategories = function (createdBy: string) {
  return this.find({ createdBy, parentId: null, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Static: find by creator
CategorySchema.statics.findByCreator = function (createdBy: string) {
  return this.find({ createdBy, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Static: get category tree
CategorySchema.statics.getCategoryTree = async function (createdBy: string) {
  const categories = await this.find({ createdBy, isActive: true }).sort({ sortOrder: 1, name: 1 });
  const buildTree = (parentId: mongoose.Types.ObjectId | null = null) => {
    return categories
      .filter((cat: any) => cat.parentId?.toString() === parentId?.toString())
      .map((cat: any) => ({
        ...cat.toObject(),
        children: buildTree(cat._id),
      }));
  };
  return buildTree();
};

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
