import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  lastLoginAt?: Date;
  phone?: string;
  location?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  currency?: string;
  dateFormat?: string;
  emailNotifications?: boolean;
  lowStockAlerts?: boolean;
  weeklyReports?: boolean;
  marketingEmails?: boolean;
  theme?: 'light' | 'dark' | 'system';
  autoLogout?: boolean;
  twoFactorAuth?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: {
    type: String,
    required: [true, 'Clerk ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
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
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'manager', 'user'],
      message: 'Role must be either admin, manager, or user'
    },
    default: 'user',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  timezone: {
    type: String,
    trim: true,
    default: 'UTC'
  },
  language: {
    type: String,
    trim: true,
    default: 'en',
    enum: {
      values: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh'],
      message: 'Language must be a supported language code'
    }
  },
  currency: {
    type: String,
    trim: true,
    default: 'USD',
    enum: {
      values: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'],
      message: 'Currency must be a supported currency code'
    }
  },
  dateFormat: {
    type: String,
    trim: true,
    default: 'MM/DD/YYYY',
    enum: {
      values: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MM-DD-YYYY'],
      message: 'Date format must be a supported format'
    }
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  lowStockAlerts: {
    type: Boolean,
    default: true
  },
  weeklyReports: {
    type: Boolean,
    default: false
  },
  marketingEmails: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    enum: {
      values: ['light', 'dark', 'system'],
      message: 'Theme must be light, dark, or system'
    },
    default: 'system'
  },
  autoLogout: {
    type: Boolean,
    default: true
  },
  twoFactorAuth: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better query performance
UserSchema.index({ clerkId: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 });

// Compound indexes for common queries
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ email: 1, isActive: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name (uses name field or falls back to full name)
UserSchema.virtual('displayName').get(function() {
  return this.name || this.fullName;
});

// Pre-save middleware to set name if not provided
UserSchema.pre('save', function(next) {
  if (!this.name) {
    this.name = this.fullName;
  }
  next();
});

// Instance method to check if user is admin
UserSchema.methods.isAdmin = function(): boolean {
  return this.role === 'admin';
};

// Instance method to check if user is manager or admin
UserSchema.methods.isManagerOrAdmin = function(): boolean {
  return this.role === 'admin' || this.role === 'manager';
};

// Static method to find active users
UserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find users by role
UserSchema.statics.findByRole = function(role: string) {
  return this.find({ role, isActive: true });
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 