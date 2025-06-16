import mongoose, { Document } from 'mongoose';

export interface IChildRegistration {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  avatarUrl?: string;
  level: string;
  countryName: string;
}

export interface IChildDocument {
  _id?: any;
  firstName: string;
  lastName: string;
  fullName: string; // Virtual field
  age: number; // Virtual field
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  level: string;
  avatarUrl?: string;
  countryId: mongoose.Types.ObjectId;
  registrationNumber: string;
  enrollmentDate: Date;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  getAge(): number;
}

export interface IParentRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  countryName: string;
}

export interface IParentDocument {
  firstName: string;
    lastName: string;
    fullName: string; // Virtual field
  email: string;
  password: string;
  phoneNumber?: string;
  children: IChildDocument[];
  countryId: mongoose.Types.ObjectId;
  isActive: boolean;
  enrollmentDate: Date;
  refreshToken?: string;
  userType: 'parent';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IParentMethods {
  comparePassword(enteredPassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  getFullName(): string;
  getAge(): number;
}

// export interface IChildMethods {
//   getFullName(): string;
//   getAge(): number;
// }

// export interface IChild extends IChildDocument, IChildMethods, Document {}
export interface IParent extends IParentDocument, IParentMethods, Document {}
