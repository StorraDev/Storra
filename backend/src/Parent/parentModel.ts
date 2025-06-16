import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IParent, IChildDocument} from '../types/parentTypes';
import ms from 'ms';

const childSchema = new Schema<IChildDocument>({
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
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  avatarUrl: { type: String },
  level: { type: String,
        enum: ['primary', 'secondary', 'tertiary'],
        required: [true, 'Child level is required'],
        index: true },
    registrationNumber: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        index: true
    },
  countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Country',
        required: [true, 'Country ID is required'],
        index: true
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
}, { timestamps: true });

const parentSchema = new Schema<IParent>({
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
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  children: { type: [childSchema], default: [] },
  countryId: {
          type: Schema.Types.ObjectId,
          ref: 'Country',
          required: [true, 'Country ID is required'],
          index: true
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
        enum: ['parent'],
        default: 'parent'
    },
  refreshToken: { type: String }
}, { timestamps: true });


parentSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

childSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
childSchema.virtual('age').get(function() {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

parentSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

parentSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

parentSchema.methods.generateAccessToken = function(): string {
    const payload = {
        _id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        userType: this.userType,
        countryId: this.countryId,
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

parentSchema.methods.generateRefreshToken = function(): string {
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
parentSchema.methods.getFullName = function(): string {
    return `${this.firstName} ${this.lastName}`;
};

childSchema.methods.getFullName = function(): string {
    return `${this.firstName} ${this.lastName}`;
};

childSchema.methods.getAge = function(): number {
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
childSchema.pre('save', function(next) {
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



export const Parent = mongoose.model<IParent>('Parent', parentSchema);
