// types/schoolTypes.ts
import mongoose, { Document } from 'mongoose';

export interface ISchoolRegistration {
    name: string;
    email: string;
    password: string;
    countryId: string;
    address: string;
    phone: string;
    schoolLevels: SchoolLevel[];
    subscriptionType: SubscriptionType;
}

export interface ISchoolDocument {
    name: string;
    email: string;
    password: string;
    countryId: mongoose.Types.ObjectId;
    //countryCode: string;
    registrationNumber: string;
    address: string;
    phone: string;
    schoolLevels: SchoolLevel[];
    subscriptionType: SubscriptionType;
    maxStudents: number;
    currentStudents: number;
    primaryStudents: string[]; 
    secondaryStudents: string[]; 
    tertiaryStudents: string[]; 
    isVerified: boolean;
    userType: 'school';
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type SchoolLevel = 'primary' | 'secondary' | 'tertiary';

export type SubscriptionType = 'basic' | 'standard' | 'premium';

export interface SubscriptionPlan {
    type: SubscriptionType;
    maxStudents: number;
    price: number;
    features: string[];
}

export interface ISchoolMethods {
    comparePassword(enteredPassword: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
    canRegisterStudent(): boolean;
    addStudent(studentId: string, level: SchoolLevel): Promise<void>;
    removeStudent(studentId: string, level: SchoolLevel): Promise<void>;
}

export interface ISchoolDocuments extends ISchoolDocument, ISchoolMethods, Document {}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: Record<SubscriptionType, SubscriptionPlan> = {
    basic: {
        type: 'basic',
        maxStudents: 100,
        price: 50,
        features: ['Basic student management', 'Basic reporting']
    },
    standard: {
        type: 'standard',
        maxStudents: 1000,
        price: 200,
        features: ['Advanced student management', 'Detailed reporting', 'Parent portal']
    },
    premium: {
        type: 'premium',
        maxStudents: 10000,
        price: 500,
        features: ['Enterprise features', 'Advanced analytics', 'API access', 'Priority support']
    }
};