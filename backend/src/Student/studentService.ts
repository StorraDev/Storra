import { Student } from './studentModel';
import { School } from '../School/schoolModel';
import { Country } from '../Country/countryModel';
import { logger } from '../utils/logger';
import { client as redis } from '../config/redis/redis';
import { getNextStudentCounter } from '../config/redis/redisStudentCounter';
import { IStudentRegistration } from '../types/studentTypes';


const registerStudentService = async (data: IStudentRegistration) => {
    const { firstName, lastName, email, password, address, phone, countryName, schoolName, dateOfBirth, level   } = data;

    try {
        // 1. Validate and get country
        const country = await Country.findOne({ name: { $regex: new RegExp(`^${countryName.trim()}$`, 'i') } });
        if (!country) {
            throw new Error('Country not found');
        }

        const school = await School.findOne({ name: { $regex: new RegExp(`^${schoolName.trim()}$`, 'i') }, countryId: country._id });
        if (!school) {
            throw new Error('School not found in the specified country');
        }

        // 2. Check if school email already exists
        const existingStudent = await Student.findOne({ email: email.toLowerCase() });
        if (existingStudent) {
            logger.warn(`Student with email ${email} already exists`);
            throw new Error('Email already registered');
        }

        // 3. Validate levels
       const validLevels = await School.findById(school._id, 'schoolLevels');
        if (!validLevels || !validLevels.schoolLevels.includes(level)) {
            throw new Error('Invalid school level');
        }

        //  Validate student to choose only one level
        if (Array.isArray(level) && level.length > 1) {
            throw new Error('You can only select one school level');
        }

        const levelToUse = Array.isArray(level) ? level[0] : level;

        // validate date of birth
        if (!dateOfBirth || !(dateOfBirth instanceof Date) || isNaN(dateOfBirth.getTime())) {
            throw new Error('Invalid date of birth');
        }

        // 5. Generate unique registration number
        const registrationNumber = await getNextStudentCounter(country.registrationNumber, school.registrationNumber);
        const schoolNumber = parseInt(registrationNumber.split('STU')[1]);
        // 6. Create school
        const newSchool = await School.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            password: password.trim(),
            countryId: country._id,
            countryCode: country.countryCode,
            dateOfBirth,
            level: levelToUse,
            schoolId: school._id,
            schoolName,
            registrationNumber,
            address: address.trim(),
            phone: phone.trim(),
            userType: 'student',
            isVerified: false
        });

        await redis.set('global:schoolCounter', sNumber);

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