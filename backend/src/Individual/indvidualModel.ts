import mongoose, { Schema, Document } from 'mongoose';
import { IIndividualDocuments, IIndividualMethods } from '../types/individualTypes';
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


interface IndividualModel extends mongoose.Model<IIndividualDocuments> {}

const IndividualSchema = new Schema<IIndividualDocuments, IndividualModel, IIndividualMethods>({
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
    phone: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(phone: string) {
                return !phone || validator.isMobilePhone(phone, 'any');
            },
            message: 'Please provide a valid parent phone number'
        }
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
        validate: {
            validator: function(date: Date) {
                return date < new Date();
            },
            message: 'Date of birth must be in the past'
        }
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: [true, 'Gender is required']
    },
    countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Country',
        required: [true, 'Country ID is required'],
        index: true
    },
    level: {
        type: String,
        enum: ['primary', 'secondary', 'tertiary'],
        required: [true, 'Individual school level is required'],
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
        required: [true, 'Address is required'],
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    userType: {
        type: String,
        enum: ['individual'],
        default: 'individual'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
IndividualSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
IndividualSchema.virtual('age').get(function() {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

IndividualSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

IndividualSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

IndividualSchema.methods.generateAccessToken = function(): string {
    const payload = {
        _id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        level: this.level,
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

IndividualSchema.methods.generateRefreshToken = function(): string {
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
// Methods
IndividualSchema.methods.getFullName = function(): string {
    return `${this.firstName} ${this.lastName}`;
};

IndividualSchema.methods.getAge = function(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

// Pre-save middleware to validate age based on individual school level
IndividualSchema.pre('save', function(next) {
    const age = this.getAge();
    
    // Basic age validation based on level
    if (this.level === 'primary' && (age < 3 || age > 15)) {
        return next(new Error('Primary level students should typically be between 3-12 years old'));
    } else if (this.level === 'secondary' && (age < 10 || age > 24)) {
        return next(new Error('Secondary level students should typically be between 10-20 years old'));
    } else if (this.level === 'tertiary' && age < 16) {
        return next(new Error('Tertiary level students should typically be 16 years or older'));
    }
    
    next();
});

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


export const Individual = mongoose.model<IIndividualDocuments>('Individual', IndividualSchema);