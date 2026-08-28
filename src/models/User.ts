import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';

export interface IUser extends Document {
  authId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  // Seller / Admin contact info (shown to buyers on order pages)
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
  // Telegram integration
  telegramChatId?: string;
  // Shop / store info (for sellers)
  shopName?: string;
  shopDescription?: string;
  // Preferences
  timezone?: string;
  language?: string;
  currency?: string;
  theme?: 'light' | 'dark' | 'system';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  authId: {
    type: String,
    required: [true, 'Auth ID is required'],
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: {
      values: ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER'],
      message: 'Role must be SUPER_ADMIN, ADMIN, or CUSTOMER',
    },
    default: 'CUSTOMER',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  // Contact info
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters'],
  },
  whatsapp: {
    type: String,
    trim: true,
    maxlength: [50, 'WhatsApp contact cannot exceed 50 characters'],
  },
  telegram: {
    type: String,
    trim: true,
    maxlength: [50, 'Telegram username cannot exceed 50 characters'],
  },
  instagram: {
    type: String,
    trim: true,
    maxlength: [50, 'Instagram handle cannot exceed 50 characters'],
  },
  // Telegram integration
  telegramChatId: {
    type: String,
    trim: true,
  },
  // Shop info
  shopName: {
    type: String,
    trim: true,
    maxlength: [100, 'Shop name cannot exceed 100 characters'],
  },
  shopDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Shop description cannot exceed 500 characters'],
  },
  // Preferences
  timezone: {
    type: String,
    trim: true,
    default: 'UTC',
  },
  language: {
    type: String,
    trim: true,
    default: 'en',
  },
  currency: {
    type: String,
    trim: true,
    default: 'USD',
  },
  theme: {
    type: String,
    enum: {
      values: ['light', 'dark', 'system'],
      message: 'Theme must be light, dark, or system',
    },
    default: 'system',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes (unique already handled by field definitions)
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Compound indexes
UserSchema.index({ role: 1, isActive: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Static method to find admins (SUPER_ADMIN + ADMIN)
UserSchema.statics.findAdmins = function () {
  return this.find({ role: { $in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true });
};

// Static method to find the primary seller (first SUPER_ADMIN)
UserSchema.statics.findPrimarySeller = function () {
  return this.findOne({ role: 'SUPER_ADMIN', isActive: true });
};

// Static method to find active customers
UserSchema.statics.findCustomers = function () {
  return this.find({ role: 'CUSTOMER', isActive: true });
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
