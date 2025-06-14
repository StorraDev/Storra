// types/studentTypes.ts
import mongoose, { Document } from 'mongoose';
import { SchoolLevel } from './schoolTypes';

export interface IStudentRegistration {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    countryName: string;
    schoolName: string;
    level: SchoolLevel;
    parentEmail?: string;
    parentPhone?: string;
    address: string;
}

export interface IStudentDocument {
    firstName: string;
    lastName: string;
    fullName: string; // Virtual field
    email: string;
    password: string;
    phone: string;
    dateOfBirth: Date;
    age: number; // Virtual field
    gender: 'male' | 'female' | 'other';
    schoolId: mongoose.Types.ObjectId;
    level: SchoolLevel;
    registrationNumber: string;
    parentEmail?: string;
    parentPhone?: string;
    address: string;
    schoolName: string;
    countryName: string;
    isActive: boolean;
    isVerified: boolean;
    profilePicture?: string;
    refreshToken?: string;
    enrollmentDate: Date;
    userType: 'student';
    createdAt: Date;
    updatedAt: Date;
}

export interface IStudentMethods {
    comparePassword(enteredPassword: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
    getFullName(): string;
    getAge(): number;
}

export interface IStudentDocuments extends IStudentDocument, IStudentMethods, Document {}