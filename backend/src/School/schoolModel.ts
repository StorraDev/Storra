// School/schoolModel.ts
import mongoose, { Schema, Document } from 'mongoose';
import { ISchoolDocuments, ISchoolMethods, SchoolLevel, SubscriptionType, SUBSCRIPTION_PLANS } from '../types/schoolTypes';
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ms from 'ms';

declare global {
    namespace NodeJS {
      interface ProcessEnv {
        ACCESS_TOKEN_SECRET: string;
        REFRESH_TOKEN_SECRET: string;
        ACCESS_TOKEN_EXPIRY: string;
        REFRESH_TOKEN_EXPIRY: string;
      }
    }
}

interface SchoolModel extends mongoose.Model<ISchoolDocuments> {}

const SchoolSchema = new Schema<ISchoolDocuments, SchoolModel, ISchoolMethods>({
    name: {
        type: String,
        required: [true, 'School name is required'],
        trim: true,
        index: true,
        maxlength: [100, 'School name cannot exceed 100 characters']
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'], 
        unique: true,
        lowercase: true,
        validate: { 
            validator: (email: string) => validator.isEmail(email), 
            message: 'Please provide a valid email address'
        } 
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Country',
        required: [true, 'Country ID is required'],
        index: true
    },
    countryCode: {
        type: String,
        required: [true, 'Country code is required'],
        uppercase: true,
        index: true
    },
    registrationNumber: { 
        type: String, 
        required: false,
        unique: true,
        sparse: true,
        index: true
    },
    address: {
        type: String,
        required: [true, 'School address is required'],
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        validate: {
            validator: function(phone: string) {
                return validator.isMobilePhone(phone, 'any');
            },
            message: 'Please provide a valid phone number'
        }
    },
    schoolLevels: [{
        type: String,
        enum: ['primary', 'secondary', 'tertiary'],
        required: true
    }],
    subscriptionType: {
        type: String,
        enum: ['basic', 'standard', 'premium'],
        default: 'basic',
        required: true
    },
    maxStudents: {
        type: Number,
        required: true,
        default: function() {
            return SUBSCRIPTION_PLANS[this.subscriptionType as SubscriptionType].maxStudents;
        }
    },
    currentStudents: {
        type: Number,
        default: 0,
        min: [0, 'Current students cannot be negative']
    },
    primaryStudents: [{
        type: Schema.Types.ObjectId,
        ref: 'Student'
    }],
    secondaryStudents: [{
        type: Schema.Types.ObjectId,
        ref: 'Student'
    }],
    tertiaryStudents: [{
        type: Schema.Types.ObjectId,
        ref: 'Student'
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    userType: {
        type: String,
        enum: ['school'],
        default: 'school'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
SchoolSchema.index({ countryId: 1, registrationNumber: 1 });
SchoolSchema.index({ email: 1 });
SchoolSchema.index({ 'schoolLevels': 1 });
SchoolSchema.index({ subscriptionType: 1 });

// Virtual for country details
SchoolSchema.virtual('country', {
    ref: 'Country',
    localField: 'countryId',
    foreignField: '_id',
    justOne: true
});

// Pre-save middleware to hash password
SchoolSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Pre-save middleware to set maxStudents based on subscription
SchoolSchema.pre('save', function(next) {
    if (this.isModified('subscriptionType') || this.isNew) {
        this.maxStudents = SUBSCRIPTION_PLANS[this.subscriptionType].maxStudents;
    }
    next();
});

// Pre-save middleware to validate school levels
SchoolSchema.pre('save', function(next) {
    if (this.schoolLevels.length === 0) {
        return next(new Error('At least one school level must be selected'));
    }
    
    // Remove duplicates
    this.schoolLevels = [...new Set(this.schoolLevels)];
    next();
});

// Methods
SchoolSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

SchoolSchema.methods.generateAccessToken = function(): string {
    const payload = {
        _id: this._id,
        name: this.name,
        email: this.email,
        userType: this.userType,
        countryId: this.countryId,
        registrationNumber: this.registrationNumber
    };

    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is not configured');
    }

    const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
    if (!accessTokenExpiry || !isValidExpiry(accessTokenExpiry)) {
        throw new Error('Invalid ACCESS_TOKEN_EXPIRY format. Use like "15m" or "1h"');
    }

    const opts = { expiresIn: accessTokenExpiry } as jwt.SignOptions;
    
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, opts);
};

SchoolSchema.methods.generateRefreshToken = function(): string {
    const payload = { 
        _id: this._id,
        userType: this.userType
    };

    if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('REFRESH_TOKEN_SECRET is not configured');
    }

    const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;
    if (!refreshTokenExpiry || !isValidExpiry(refreshTokenExpiry)) {
        throw new Error('Invalid REFRESH_TOKEN_EXPIRY format. Use like "7d" or "30d"');
    }
        
    const opts = { expiresIn: refreshTokenExpiry } as jwt.SignOptions;

    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, opts);
};

SchoolSchema.methods.canRegisterStudent = function(): boolean {
    return this.currentStudents < this.maxStudents;
};

SchoolSchema.methods.addStudent = async function(studentId: string, level: SchoolLevel): Promise<void> {
    if (!this.canRegisterStudent()) {
        throw new Error(`Cannot register more students. Maximum capacity (${this.maxStudents}) reached.`);
    }

    if (!this.schoolLevels.includes(level)) {
        throw new Error(`School does not offer ${level} level education`);
    }

    const studentIdObj = new mongoose.Types.ObjectId(studentId);

    // Add to appropriate level array
    switch (level) {
        case 'primary':
            if (!this.primaryStudents.some((id: any) => new mongoose.Types.ObjectId(id).equals(studentIdObj))) {
                this.primaryStudents.push(studentIdObj.toString());
            }
            break;
        case 'secondary':
            if (!this.secondaryStudents.some((id: any) => new mongoose.Types.ObjectId(id).equals(studentIdObj))) {
                this.secondaryStudents.push(studentIdObj.toString());
            }
            break;
        case 'tertiary':
            if (!this.tertiaryStudents.some((id: any) => new mongoose.Types.ObjectId(id).equals(studentIdObj))) {
                this.tertiaryStudents.push(studentIdObj.toString());
            }
            break;
    }

    // Update current students count
    this.currentStudents = this.primaryStudents.length + this.secondaryStudents.length + this.tertiaryStudents.length;
    
    await this.save();
};

SchoolSchema.methods.removeStudent = async function(studentId: string, level: SchoolLevel): Promise<void> {
    const studentIdObj = new mongoose.Types.ObjectId(studentId);

    // Remove from appropriate level array
    switch (level) {
        case 'primary':
            this.primaryStudents = this.primaryStudents.filter(
                id => !(new mongoose.Types.ObjectId(id).equals(studentIdObj))
            );
            break;
        case 'secondary':
            this.secondaryStudents = this.secondaryStudents.filter(
                id => !(new mongoose.Types.ObjectId(id).equals(studentIdObj))
            );
            break;
        case 'tertiary':
            this.tertiaryStudents = this.tertiaryStudents.filter(
                id => !(new mongoose.Types.ObjectId(id).equals(studentIdObj))
            );
            break;
    }

    // Update current students count
    this.currentStudents = this.primaryStudents.length + this.secondaryStudents.length + this.tertiaryStudents.length;
    
    await this.save();
};

// Helper function to validate expiry format
function isValidExpiry(expiry: any): boolean {
    if(Number(expiry) < 0) return false;

    const regexIsNumber = /^\d+$/;
    const regexAlphaNum = /^(\d{1,})+\s?[a-z]+$/;

    const isNumber = regexIsNumber.test(expiry);
    const isAlphaNum = regexAlphaNum.test(expiry);

    if (isNumber) return true;
    else {
        if(isAlphaNum) {
            try {
                const milliseconds = ms(expiry);
                return milliseconds != undefined ? true : false;
            } catch {
                return false;
            }
        } else return false;
    }
}

export const School = mongoose.model<ISchoolDocuments>('School', SchoolSchema);