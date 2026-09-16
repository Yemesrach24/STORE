import mongoose, { Schema, Document } from 'mongoose';

export interface IItemSize {
  name: string;
  nameAm?: string;
  price?: number; // optional — falls back to source base price if omitted
}

export interface IItemSource {
  enabled: boolean;
  basePrice: number;
  sizes: IItemSize[];
}

export interface IItem extends Document {
  // Bilingual names/descriptions
  name: string;
  nameAm?: string;
  description: string;
  descriptionAm?: string;
  uniqueNumber: string;
  categoryId: mongoose.Types.ObjectId;

  // Color (bilingual, optional)
  color?: string;
  colorAm?: string;

  // Local & imported: each can be enabled independently, each has its own base price and sizes
  local: IItemSource;
  imported: IItemSource;

  // Company / contact info (shown to buyers)
  companyName?: string;
  companyNameAm?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  companyTelegram?: string;
  companyInstagram?: string;
  companyEmail?: string;

  // Additional info
  supplier?: string;
  supplierAm?: string;
  imageUrl?: string;
  imageUrls?: string[];
  tags?: string[];
  tagsAm?: string[];
  location?: string;

  // Ownership
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSizeSchema = new Schema<IItemSize>(
  {
    name: { type: String, required: true, trim: true },
    nameAm: { type: String, trim: true },
    price: { type: Number, min: [0, 'Price cannot be negative'] },
  },
  { _id: false }
);

const ItemSourceSchema = new Schema<IItemSource>(
  {
    enabled: { type: Boolean, default: false },
    basePrice: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    sizes: { type: [ItemSizeSchema], default: [] },
  },
  { _id: false }
);

const ItemSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [200, 'Item name cannot exceed 200 characters'],
    },
    nameAm: {
      type: String,
      trim: true,
      maxlength: [200, 'Amharic item name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    descriptionAm: {
      type: String,
      trim: true,
      maxlength: [2000, 'Amharic description cannot exceed 2000 characters'],
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
    color: {
      type: String,
      trim: true,
      maxlength: [200, 'Color cannot exceed 200 characters'],
    },
    colorAm: {
      type: String,
      trim: true,
      maxlength: [200, 'Amharic color cannot exceed 200 characters'],
    },

    // Local vs imported — both can be enabled simultaneously
    local: {
      type: ItemSourceSchema,
      default: () => ({ enabled: false, basePrice: 0, sizes: [] }),
    },
    imported: {
      type: ItemSourceSchema,
      default: () => ({ enabled: false, basePrice: 0, sizes: [] }),
    },

    // Company / contact info
    companyName: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    companyNameAm: {
      type: String,
      trim: true,
      maxlength: [200, 'Amharic company name cannot exceed 200 characters'],
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
    supplierAm: {
      type: String,
      trim: true,
      maxlength: [200, 'Amharic supplier cannot exceed 200 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    imageUrls: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true, maxlength: [50, 'Tag cannot exceed 50 characters'] }],
    tagsAm: [{ type: String, trim: true, maxlength: [50, 'Amharic tag cannot exceed 50 characters'] }],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ItemSchema.index({ name: 1 });
ItemSchema.index({ createdBy: 1 });
ItemSchema.index({ isActive: 1 });
ItemSchema.index({ createdAt: -1 });

// Compound indexes
ItemSchema.index({ categoryId: 1, isActive: 1 });
ItemSchema.index({ createdBy: 1, isActive: 1 });

// Text index for search (includes Amharic fields for bilingual search)
ItemSchema.index({ name: 'text', nameAm: 'text', description: 'text', descriptionAm: 'text', tags: 'text', tagsAm: 'text', color: 'text', colorAm: 'text' });

// Virtual for category (populate)
ItemSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
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
