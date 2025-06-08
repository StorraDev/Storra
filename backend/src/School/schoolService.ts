// School/schoolService.ts
import { School } from './schoolModel';
import { Country } from '../Country/countryModel';
import { logger } from '../utils/logger';
import { getNextSchoolCounter } from '../config/redis/redisSchoolCounter';
import { ISchoolRegistration, SUBSCRIPTION_PLANS } from '../types/schoolTypes';

const registerSchoolService = async (data: ISchoolRegistration) => {
    const { name, email, password, countryId, address, phone, schoolLevels, subscriptionType } = data;

    try {
        // 1. Validate and get country information
        const country = await Country.findById(countryId);
        if (!country) {
            logger.error(`Country not found with ID: ${countryId}`);
            throw new Error('Country not found');
        }

        if (!country.isVerified) {
            logger.error(`Country not verified: ${country.name}`);
            throw new Error('Country must be verified before schools can register');
        }

        // 2. Check if school email already exists
        const existingSchool = await School.findOne({
            email: email.toLowerCase()
        });

        if (existingSchool) {
            logger.error(`Email already registered: ${email}`);
            throw new Error('Email already registered');
        }

        // 3. Validate school levels
        if (!schoolLevels || schoolLevels.length === 0) {
            throw new Error('At least one school level must be selected');
        }

        const validLevels = ['primary', 'secondary', 'tertiary'];
        const invalidLevels = schoolLevels.filter(level => !validLevels.includes(level));
        if (invalidLevels.length > 0) {
            throw new Error(`Invalid school levels: ${invalidLevels.join(', ')}`);
        }

        // 4. Validate subscription type
        if (!SUBSCRIPTION_PLANS[subscriptionType]) {
            throw new Error('Invalid subscription type');
        }

        // 5. Generate unique registration number
        const registrationNumber = await getNextSchoolCounter(country.registrationNumber);

        // 6. Create school document
        const newSchool = await School.create({
            name: name.trim(),
            email: email.toLowerCase(),
            password: password.trim(),
            countryId: country._id,
            countryCode: country.countryCode,
            registrationNumber,
            address: address.trim(),
            phone: phone.trim(),
            schoolLevels: [...new Set(schoolLevels)], // Remove duplicates
            subscriptionType,
            maxStudents: SUBSCRIPTION_PLANS[subscriptionType].maxStudents,
            currentStudents: 0,
            primaryStudents: [],
            secondaryStudents: [],
            tertiaryStudents: [],
            userType: 'school',
            isVerified: false
        });

        logger.info(`✅ School registered successfully: ${newSchool.name} (${newSchool.registrationNumber}) under ${country.name}`);

        // 7. Return created school with country info
        return {
            school: newSchool,
            countryInfo: {
                name: country.name,
                code: country.countryCode,
                registrationNumber: country.registrationNumber
            },
            subscriptionInfo: SUBSCRIPTION_PLANS[subscriptionType]
        };

    } catch (error) {
        logger.error('❌ Error in registerSchoolService', { 
            error: (error as Error).message,
            schoolName: name,
            countryId
        });
        
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error('Failed to register school');
        }
    }
};

const getSchoolInfo = async (schoolId: string) => {
    try {
        const school = await School.findById(schoolId)
            .populate('countryId', 'name countryCode registrationNumber')
            .select('-password');

        if (!school) {
            throw new Error('School not found');
        }

        return {
            school,
            subscriptionInfo: SUBSCRIPTION_PLANS[school.subscriptionType],
            studentCapacity: {
                current: school.currentStudents,
                maximum: school.maxStudents,
                remaining: school.maxStudents - school.currentStudents,
                canRegisterMore: school.canRegisterStudent()
            },
            levelBreakdown: {
                primary: school.primaryStudents.length,
                secondary: school.secondaryStudents.length,
                tertiary: school.tertiaryStudents.length
            }
        };

    } catch (error) {
        logger.error('❌ Error in getSchoolInfo', { 
            error: (error as Error).message,
            schoolId
        });
        throw error;
    }
};

const updateSchoolSubscription = async (schoolId: string, newSubscriptionType: 'basic' | 'standard' | 'premium') => {
    try {
        const school = await School.findById(schoolId);
        if (!school) {
            throw new Error('School not found');
        }

        const newPlan = SUBSCRIPTION_PLANS[newSubscriptionType];
        const currentStudents = school.currentStudents;

        // Check if current students exceed new plan limit
        if (currentStudents > newPlan.maxStudents) {
            throw new Error(`Cannot downgrade subscription. Current students (${currentStudents}) exceed new plan limit (${newPlan.maxStudents})`);
        }

        school.subscriptionType = newSubscriptionType;
        school.maxStudents = newPlan.maxStudents;
        
        await school.save();

        logger.info(`✅ School subscription updated: ${school.name} -> ${newSubscriptionType}`);

        return {
            school,
            oldPlan: SUBSCRIPTION_PLANS[school.subscriptionType],
            newPlan: newPlan
        };

    } catch (error) {
        logger.error('❌ Error in updateSchoolSubscription', { 
            error: (error as Error).message,
            schoolId,
            newSubscriptionType
        });
        throw error;
    }
};

const getSchoolsByCountry = async (countryId: string, page: number = 1, limit: number = 10) => {
    try {
        const skip = (page - 1) * limit;

        const schools = await School.find({ countryId })
            .select('-password')
            .populate('countryId', 'name countryCode registrationNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await School.countDocuments({ countryId });

        return {
            schools,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: schools.length,
                totalSchools: total
            }
        };

    } catch (error) {
        logger.error('❌ Error in getSchoolsByCountry', { 
            error: (error as Error).message,
            countryId
        });
        throw error;
    }
};

export { 
    registerSchoolService, 
    getSchoolInfo, 
    updateSchoolSubscription, 
    getSchoolsByCountry 
};