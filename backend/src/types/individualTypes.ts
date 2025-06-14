import mongoose, { Document } from 'mongoose';

export interface IIndividualRegistration {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    countryName: string;
    level: IndividualLevel;
    address: string;
}

export interface IIndividualDocument {
    firstName: string;
    lastName: string;
    fullName: string; // Virtual field
    email: string;
    password: string;
    phone: string;
    dateOfBirth: Date;
    age: number; // Virtual field
    gender: 'male' | 'female' | 'other';
    countryId: mongoose.Types.ObjectId;
    level: IndividualLevel;
    registrationNumber: string;
    address: string;
    countryName: string;
    isActive: boolean;
    isVerified: boolean;
    profilePicture?: string;
    refreshToken?: string;
    enrollmentDate: Date;
    userType: 'individual';
    createdAt: Date;
    updatedAt: Date;
}

export type IndividualLevel = 'primary' | 'secondary' | 'tertiary';

export interface IIndividualMethods {
    comparePassword(enteredPassword: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
    getFullName(): string;
    getAge(): number;
}

export interface IIndividualDocuments extends IIndividualDocument, IIndividualMethods, Document {}