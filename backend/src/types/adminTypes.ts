// adminTypes.ts
import { Document, Types, Model } from 'mongoose';

export enum AdminLevel {
  SUPER_ADMIN = 'super_admin',
  MAIN_ADMIN = 'main_admin',
  MINOR_ADMIN = 'minor_admin'
}

export enum AdminStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// Admin Interface
export interface IAdmin extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  adminLevel: AdminLevel;
  userType: 'admin';
  status: AdminStatus;
  countryId?: Types.ObjectId;
  permissions: string[];
  createdBy: Types.ObjectId;
  lastLogin?: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: string): boolean;
  canAccessCountry(countryId: string): boolean;
}

// Admin Model Interface with Statics
export interface IAdminModel extends Model<IAdmin> {
  findByLevel(adminLevel: AdminLevel): Promise<IAdmin[]>;
  findByCountry(countryId: string): Promise<IAdmin[]>;
}

// Invitation Methods Interface
export interface IInvitationMethods {
  isValid(): boolean;
}

// Invitation Interface
export interface IInvitation extends Document {
  _id: Types.ObjectId;
  email: string;
  adminLevel: AdminLevel;
  countryId?: Types.ObjectId;
  invitationToken: string;
  invitedBy: Types.ObjectId;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isValid(): boolean;
}

// Invitation Model Interface with Statics
export interface IInvitationModel extends Model<IInvitation> {
  findValidByToken(token: string): Promise<IInvitation | null>;
  cleanupExpired(): Promise<any>;
}

// DTO Interfaces
export interface IAdminRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adminLevel: AdminLevel;
  countryId?: string;
}

export interface IAdminLogin {
  email: string;
  password: string;
}

export interface IAdminUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: AdminStatus;
  countryId?: string;
  permissions?: string[];
}

export interface ICreateInvitation {
  email: string;
  adminLevel: AdminLevel;
  countryId?: string;
}

export interface IAcceptInvitation {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}

// JWT Token Interface
export interface IJWTPayload {
  id: string;
  userType: 'admin';
  adminLevel?: AdminLevel;
  countryId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

// Admin Permissions
export const ADMIN_PERMISSIONS = {
  // User Management
  MANAGE_PARENTS: 'manage_parents',
  MANAGE_CHILDREN: 'manage_children',
  VIEW_USERS: 'view_users',
  
  // Admin Management (Super Admin only)
  CREATE_ADMINS: 'create_admins',
  MANAGE_ADMINS: 'manage_admins',
  VIEW_ADMINS: 'view_admins',
  
  // System Management
  MANAGE_COUNTRIES: 'manage_countries',
  VIEW_ANALYTICS: 'view_analytics',
  SYSTEM_SETTINGS: 'system_settings',
  
  // Content Management
  MODERATE_CONTENT: 'moderate_content',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
} as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];

// Permission mapping by admin level
export const ADMIN_LEVEL_PERMISSIONS: Record<AdminLevel, AdminPermission[]> = {
  [AdminLevel.SUPER_ADMIN]: [
    ADMIN_PERMISSIONS.MANAGE_PARENTS,
    ADMIN_PERMISSIONS.MANAGE_CHILDREN,
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.CREATE_ADMINS,
    ADMIN_PERMISSIONS.MANAGE_ADMINS,
    ADMIN_PERMISSIONS.VIEW_ADMINS,
    ADMIN_PERMISSIONS.MANAGE_COUNTRIES,
    ADMIN_PERMISSIONS.VIEW_ANALYTICS,
    ADMIN_PERMISSIONS.SYSTEM_SETTINGS,
    ADMIN_PERMISSIONS.MODERATE_CONTENT,
    ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS,
  ],
  [AdminLevel.MAIN_ADMIN]: [
    ADMIN_PERMISSIONS.MANAGE_PARENTS,
    ADMIN_PERMISSIONS.MANAGE_CHILDREN,
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.VIEW_ANALYTICS,
    ADMIN_PERMISSIONS.MODERATE_CONTENT,
    ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS,
  ],
  [AdminLevel.MINOR_ADMIN]: [
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.MODERATE_CONTENT,
  ],
};