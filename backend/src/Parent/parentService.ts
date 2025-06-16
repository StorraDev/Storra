// Parent/parentService.ts
import { Document } from 'mongoose';
import { Parent } from './parentModel';
import { Country } from '../Country/countryModel';
import { logger } from '../utils/logger';
import { client as redis } from '../config/redis/redis';
import { getNextChildCounter } from '../config/redis/redisChildCounter';
import { IParentRegistration, IChildRegistration, IParentDocument, IChildDocument } from '../types/parentTypes';
import { ApiError } from '../utils/ApiError';
import { getAge } from '../utils/getAge';

// Register Parent Service (Parent doesn't get a registration number)
const registerParentService = async (data: IParentRegistration) => {
    const { firstName, lastName, email, password, phoneNumber, countryName } = data;

    try {
        // 1. Validate and get country
        const country = await Country.findOne({ name: { $regex: new RegExp(`^${countryName.trim()}$`, 'i') } });
        if (!country) {
            throw new Error('Country not found');
        }

        // 2. Check if parent email already exists
        const existingParent = await Parent.findOne({ email: email.toLowerCase() });
        if (existingParent) {
            logger.warn(`Parent with email ${email} already exists`);
            throw new Error('Email already registered');
        }


        // 4. Create parent (NO registration number for parent)
        const newParent = await Parent.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            password: password.trim(),
            phoneNumber: phoneNumber?.trim(),
            countryId: country._id,
            children: [], // Empty array initially
            userType: 'parent',
            isVerified: false,
            isActive: true,
            enrollmentDate: new Date()
        });

        // 5. Populate parent info
        const populatedParent = await Parent.findById(newParent._id)
            .populate('countryId')
            .select('-password -refreshToken');

        if (!populatedParent || !populatedParent.countryId) {
            throw new Error('Failed to retrieve populated country info');
        }

        const populatedCountry = populatedParent.countryId as any;

        logger.info(`✅ Parent registered: ${newParent.firstName} ${newParent.lastName} under ${populatedCountry.name}`);

        return {
            parent: populatedParent,
            countryName: populatedCountry.name,
        };

    } catch (error) {
        logger.error('❌ Error in registerParentService', {
            error: (error as Error).message,
            firstName,
            countryName
        });

        throw error instanceof ApiError ? error : new Error('Failed to register parent');
    }
};

const registerChildService = async (parentId: string, childData: IChildRegistration) => {
    const { firstName, lastName, dateOfBirth, gender, level, countryName } = childData;

    try {
        // 1. Find the parent
        const parent = await Parent.findById(parentId).populate('countryId');
        if (!parent) {
            throw new Error('Parent not found');
        }

        const country = await Country.findOne({ name: { $regex: new RegExp(`^${countryName.trim()}$`, 'i') } });
        if (!country) {
            throw new Error('Country not found');
        }

        if (parent.countryId.toString() !== (country._id as string).toString()) {
            throw new Error('Child must be registered in the same country as parent');
        }

        // 3. Validate levels
        const allowedLevels = ['primary', 'secondary', 'tertiary'];
        const levelToUse = Array.isArray(level) ? level[0] : level;

        if (!allowedLevels.includes(levelToUse)) {
            throw new Error('Level must be primary, secondary, or tertiary');
        }

        // 4. Validate date of birth and age
        const parsedDOB = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
        const age = getAge(parsedDOB);

        if (levelToUse === 'primary' && (age < 3 || age > 15)) {
            throw new Error('Primary level students should typically be between 3 and 15 years old');
        } else if (levelToUse === 'secondary' && (age < 10 || age > 24)) {
            throw new Error('Secondary level students should typically be between 10 and 24 years old');
        } else if (levelToUse === 'tertiary' && age < 16) {
            throw new Error('Tertiary level students should be 16 years or older');
        }

        if (parent.children.length >= 5) {
            throw new Error('Maximum of 5 children allowed per parent account');
        }

        // 6. Check if child name already exists under this parent
        const existingChild = parent.children.find(child => 
            child.firstName.toLowerCase() === firstName.toLowerCase().trim() && 
            child.lastName.toLowerCase() === lastName.toLowerCase().trim()
        );

        if (existingChild) {
            throw new Error('A child with this name already exists in your account');
        }

        // 7. Generate unique registration number for child
        const registrationNumber = await getNextChildCounter(country.registrationNumber);
        const childNumber = parseInt(registrationNumber.split('CHD')[1]);

        // 8. Create child object
        const newChild = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            dateOfBirth: parsedDOB,
            gender,
            level: levelToUse,
            countryId: country._id,
            registrationNumber,
            enrollmentDate: new Date(),
            isActive: true,
            isVerified: false
        };

        // 9. Add child to parent's children array
        parent.children.push(newChild as any);
        await parent.save();

        await redis.set('global:childCounter', childNumber);

        const updatedParent = await Parent.findById(parentId)
            .populate('countryId')
            .select('-password -refreshToken');

        const addedChild = updatedParent?.children[updatedParent.children.length - 1];

        logger.info(`✅ Child registered: ${newChild.firstName} ${newChild.lastName} (${registrationNumber}) under parent ${parent.firstName} ${parent.lastName}`);

        return {
            child: addedChild,
            parent: updatedParent,
            country: country
        };

    } catch (error) {
        logger.error('❌ Error in registerChildService', {
            error: (error as Error).message,
            parentId,
            firstName,
            countryName
        });

        throw error instanceof ApiError ? error : new Error('Failed to register child');
    }
};

// Get Parent's Children Service
const getParentChildrenService = async (parentId: string) => {
    try {
        const parent = await Parent.findById(parentId)
            .populate('countryId')
            .select('-password -refreshToken');

        if (!parent) {
            throw new Error('Parent not found');
        }

        return {
            parent: {
                _id: parent._id,
                firstName: parent.firstName,
                lastName: parent.lastName,
                email: parent.email,
                phoneNumber: parent.phoneNumber
            },
            children: parent.children,
            totalChildren: parent.children.length
        };

    } catch (error) {
        logger.error('❌ Error in getParentChildrenService', {
            error: (error as Error).message,
            parentId
        });

        throw error instanceof ApiError ? error : new Error('Failed to get parent children');
    }
};

// Update Child Service
const updateChildService = async (parentId: string, childId: string, updateData: Partial<IChildRegistration>) => {
    try {
        const parent = await Parent.findById(parentId);
        if (!parent) {
            throw new Error('Parent not found');
        }

        const childIndex = parent.children.findIndex(child => child._id?.toString() === childId);
        if (childIndex === -1) {
            throw new Error('Child not found');
        }

        // Update child data
        if (updateData.firstName) parent.children[childIndex].firstName = updateData.firstName.trim();
        if (updateData.lastName) parent.children[childIndex].lastName = updateData.lastName.trim();
        if (updateData.dateOfBirth) parent.children[childIndex].dateOfBirth = new Date(updateData.dateOfBirth);
        if (updateData.gender) parent.children[childIndex].gender = updateData.gender;
        if (updateData.level) parent.children[childIndex].level = updateData.level;
        if (updateData.avatarUrl !== undefined) parent.children[childIndex].avatarUrl = updateData.avatarUrl?.trim();

        await parent.save();

        const updatedParent = await Parent.findById(parentId)
            .populate('countryId')
            .select('-password -refreshToken');

        logger.info(`✅ Child updated: ${parent.children[childIndex].firstName} ${parent.children[childIndex].lastName}`);

        return {
            child: updatedParent?.children[childIndex],
            parent: updatedParent
        };

    } catch (error) {
        logger.error('❌ Error in updateChildService', {
            error: (error as Error).message,
            parentId,
            childId
        });

        throw error instanceof ApiError ? error : new Error('Failed to update child');
    }
};

// Delete Child Service
const deleteChildService = async (parentId: string, childId: string) => {
    try {
        const parent = await Parent.findById(parentId);
        if (!parent) {
            throw new Error('Parent not found');
        }

        const childIndex = parent.children.findIndex(child => child._id?.toString() === childId);
        if (childIndex === -1) {
            throw new Error('Child not found');
        }

        const deletedChild = parent.children[childIndex];
        parent.children.splice(childIndex, 1);
        await parent.save();

        logger.info(`✅ Child deleted: ${deletedChild.firstName} ${deletedChild.lastName}`);

        return {
            message: 'Child deleted successfully',
            deletedChild: {
                firstName: deletedChild.firstName,
                lastName: deletedChild.lastName,
                registrationNumber: deletedChild.registrationNumber
            }
        };

    } catch (error) {
        logger.error('❌ Error in deleteChildService', {
            error: (error as Error).message,
            parentId,
            childId
        });

        throw error instanceof ApiError ? error : new Error('Failed to delete child');
    }
};

export {
    registerParentService,
    registerChildService,
    getParentChildrenService,
    updateChildService,
    deleteChildService
};