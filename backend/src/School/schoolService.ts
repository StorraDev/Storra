import { School } from './schoolModel';
import { Country } from '../Country/countryModel';
import { logger } from '../utils/logger';
import { client as redis } from '../config/redis/redis';
import { getNextSchoolCounter } from '../config/redis/redisSchoolCounter';
import { ISchoolRegistration, SUBSCRIPTION_PLANS } from '../types/schoolTypes';

const registerSchoolService = async (data: ISchoolRegistration) => {
    const { name, email, password, countryName, address, phone, schoolLevels, subscriptionType } = data;

    try {
        // 1. Validate and get country
        const country = await Country.findOne({ name: { $regex: new RegExp(`^${countryName.trim()}$`, 'i') } });
        if (!country) {
            throw new Error('Country not found');
        }

        // 2. Check if school email already exists
        const existingSchool = await School.findOne({ email: email.toLowerCase() });
        if (existingSchool) {
            throw new Error('Email already registered');
        }

        // 3. Validate levels
        const validLevels = ['primary', 'secondary', 'tertiary'];
        const invalidLevels = schoolLevels.filter(level => !validLevels.includes(level));
        if (invalidLevels.length > 0) {
            throw new Error(`Invalid school levels: ${invalidLevels.join(', ')}`);
        }

        // 4. Validate subscription
        if (!SUBSCRIPTION_PLANS[subscriptionType]) {
            throw new Error('Invalid subscription type');
        }

        // 5. Generate unique registration number
        const registrationNumber = await getNextSchoolCounter(country.registrationNumber);
        const schoolNumber = parseInt(registrationNumber.split('SCH')[1]);
        // 6. Create school
        const newSchool = await School.create({
            name: name.trim(),
            email: email.toLowerCase(),
            password: password.trim(),
            countryId: country._id,
            countryCode: country.countryCode,
            registrationNumber,
            address: address.trim(),
            phone: phone.trim(),
            schoolLevels: [...new Set(schoolLevels)],
            subscriptionType,
            maxStudents: SUBSCRIPTION_PLANS[subscriptionType].maxStudents,
            currentStudents: 0,
            primaryStudents: [],
            secondaryStudents: [],
            tertiaryStudents: [],
            userType: 'school',
            isVerified: false
        });

        await redis.set('global:schoolCounter', schoolNumber);

        // 7. Populate country info
        const schoolWithCountry = await School.findById(newSchool._id).populate('countryId');

        if (!schoolWithCountry || !schoolWithCountry.countryId) {
            throw new Error('Failed to retrieve populated country info');
        }

        const populatedCountry = schoolWithCountry.countryId as any;

        logger.info(`✅ School registered: ${newSchool.name} (${registrationNumber}) under ${populatedCountry.name}`);

        return {
            school: schoolWithCountry,
            countryInfo: {
                name: populatedCountry.name,
                code: populatedCountry.countryCode,
                registrationNumber: populatedCountry.registrationNumber
            },
            subscriptionInfo: SUBSCRIPTION_PLANS[subscriptionType]
        };

    } catch (error) {
        logger.error('❌ Error in registerSchoolService', {
            error: (error as Error).message,
            schoolName: name,
            countryName
        });

        throw error instanceof Error ? error : new Error('Failed to register school');
    }
};


const getSchoolInfo = async (name: string) => {
    try {
        const school = await School.findOne({ name })
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
            error: (error as Error).message
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