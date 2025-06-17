// adminModel.ts
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { 
  IAdmin, 
  IAdminModel,
  IInvitation, 
  IInvitationModel,
  AdminLevel, 
  AdminStatus, 
  InvitationStatus,
  ADMIN_LEVEL_PERMISSIONS 
} from '../types/adminTypes';

// Admin Schema
const adminSchema = new Schema<IAdmin, IAdminModel>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number'],
    },
    adminLevel: {
      type: String,
      enum: Object.values(AdminLevel),
      required: [true, 'Admin level is required'],
    },
    userType: {
      type: String,
      enum: ['admin'],
      default: 'admin'
    },
    status: {
      type: String,
      enum: Object.values(AdminStatus),
      default: AdminStatus.ACTIVE,
    },
    countryId: {
      type: Schema.Types.ObjectId,
      ref: 'Country',
      required: function(this: IAdmin) {
        return this.adminLevel !== AdminLevel.SUPER_ADMIN;
      },
    },
    permissions: {
      type: [String],
      default: function(this: IAdmin) {
        return ADMIN_LEVEL_PERMISSIONS[this.adminLevel] || [];
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    lastLogin: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

// Indexes
// adminSchema.index({ email: 1 });
// adminSchema.index({ adminLevel: 1 });
// adminSchema.index({ countryId: 1 });
// adminSchema.index({ createdBy: 1 });
// adminSchema.index({ status: 1 });

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance Methods
adminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission);
};

adminSchema.methods.canAccessCountry = function(countryId: string): boolean {
  if (this.adminLevel === AdminLevel.SUPER_ADMIN) {
    return true;
  }
  return this.countryId?.toString() === countryId;
};

// Static Methods
adminSchema.statics.findByLevel = function(adminLevel: AdminLevel) {
  return this.find({ adminLevel, status: AdminStatus.ACTIVE });
};

adminSchema.statics.findByCountry = function(countryId: string) {
  return this.find({ countryId, status: AdminStatus.ACTIVE });
};

// Invitation Schema
const invitationSchema = new Schema<IInvitation, IInvitationModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    adminLevel: {
      type: String,
      enum: Object.values(AdminLevel),
      required: [true, 'Admin level is required'],
    },
    countryId: {
      type: Schema.Types.ObjectId,
      ref: 'Country',
      required: function(this: IInvitation) {
        return this.adminLevel !== AdminLevel.SUPER_ADMIN;
      },
    },
    invitationToken: {
      type: String,
      required: true,
      unique: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: function() {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      },
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Invitation Indexes
// invitationSchema.index({ email: 1 });
// invitationSchema.index({ invitationToken: 1 });
// invitationSchema.index({ invitedBy: 1 });
// invitationSchema.index({ status: 1 });
// invitationSchema.index({ expiresAt: 1 });

// Invitation Instance Methods
invitationSchema.methods.isValid = function(): boolean {
  return this.status === InvitationStatus.PENDING && this.expiresAt > new Date();
};

// Invitation Static Methods
invitationSchema.statics.findValidByToken = function(token: string) {
  return this.findOne({
    invitationToken: token,
    status: InvitationStatus.PENDING,
    expiresAt: { $gt: new Date() },
  });
};

invitationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    {
      status: InvitationStatus.PENDING,
      expiresAt: { $lt: new Date() },
    },
    {
      status: InvitationStatus.EXPIRED,
    }
  );
};

// Export Models
export const Admin = mongoose.model<IAdmin, IAdminModel>('Admin', adminSchema);
export const Invitation = mongoose.model<IInvitation, IInvitationModel>('Invitation', invitationSchema);