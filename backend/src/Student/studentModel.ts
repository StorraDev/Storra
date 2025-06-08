// Student/studentModel.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IStudentDocuments, IStudentMethods } from '../types/studentTypes';
import validator from 'validator';

interface StudentModel extends mongoose.Model<IStudentDocuments> {}

const StudentSchema = new Schema<IStudentDocuments, StudentModel, IStudentMethods>({
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
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: [true, 'School ID is required'],
        index: true
    },
    level: {
        type: String,
        enum: ['primary', 'secondary', 'tertiary'],
        required: [true, 'School level is required'],
        index: true
    },
    studentNumber: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        index: true
    },
    parentEmail: {
        type: String,
        required: false,
        lowercase: true,
        validate: {
            validator: function(email: string) {
                return !email || validator.isEmail(email);
            },
            message: 'Please provide a valid parent email address'
        }
    },
    parentPhone: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function(phone: string) {
                return !phone || validator.isMobilePhone(phone, 'any');
            },
            message: 'Please provide a valid parent phone number'
        }
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
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    userType: {
        type: String,
        enum: ['student'],
        default: 'student'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
StudentSchema.index({ schoolId: 1, level: 1 });
StudentSchema.index({ email: 1 });
StudentSchema.index({ studentNumber: 1 });
StudentSchema.index({ isActive: 1 });

// Virtual for full name
StudentSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
StudentSchema.virtual('age').get(function() {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

// Virtual for school details
StudentSchema.virtual('school', {
    ref: 'School',
    localField: 'schoolId',
    foreignField: '_id',
    justOne: true
});

// Methods
StudentSchema.methods.getFullName = function(): string {
    return `${this.firstName} ${this.lastName}`;
};

StudentSchema.methods.getAge = function(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
};

// Pre-save middleware to validate age based on school level
StudentSchema.pre('save', function(next) {
    const age = this.getAge();
    
    // Basic age validation based on level
    if (this.level === 'primary' && (age < 3 || age > 12)) {
        return next(new Error('Primary level students should typically be between 3-12 years old'));
    } else if (this.level === 'secondary' && (age < 10 || age > 20)) {
        return next(new Error('Secondary level students should typically be between 10-20 years old'));
    } else if (this.level === 'tertiary' && age < 16) {
        return next(new Error('Tertiary level students should typically be 16 years or older'));
    }
    
    next();
});

export const Student = mongoose.model<IStudentDocuments>('Student', StudentSchema);