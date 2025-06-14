import { Document } from 'mongoose';
import { Student } from './studentModel';
import { School } from '../School/schoolModel';
import { Country } from '../Country/countryModel';
import { logger } from '../utils/logger';
import { client as redis } from '../config/redis/redis';
import { getNextStudentCounter } from '../config/redis/redisStudentCounter';
import { IStudentDocument, IStudentRegistration } from '../types/studentTypes';
import { ApiError } from '../utils/ApiError'


const registerStudentService = async (data: IStudentRegistration) => {
    const { firstName, lastName, email, password, gender, address, phone, countryName, schoolName, dateOfBirth, level   } = data;

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

        if(!school.canRegisterStudent()) {
            logger.info(`Maximum student limit reached, cant register ${firstName} ${lastName}`)
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
        const studentNumber = parseInt(registrationNumber.split('STU')[1]);
        // 6. Create school
        const newStudent = await Student.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            password: password.trim(),
            gender,
            countryId: country._id,
            countryCode: country.countryCode,
            countryName,
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

        await school.addStudent(newStudent._id as string , level )

        await redis.set('global:studentCounter', studentNumber);

        // 7. Populate school info
        const studentUnderSchool = await Student.findById(newStudent._id).populate('schoolId' );

        if (!studentUnderSchool || !studentUnderSchool.schoolId) {
            throw new Error('Failed to retrieve populated school info');
        }

        const populatedSchool = studentUnderSchool.schoolId as any;

        logger.info(`✅ Student registered: ${newStudent.firstName} ${newStudent.lastName} (${registrationNumber}) under ${populatedSchool.name}`);

        const studentUnderCountry = await Student.findById(newStudent._id).populate('countryId');
        
            const countryId = (studentUnderCountry as any).countryId;
            if (!studentUnderCountry || !countryId) {
                throw new ApiError({ statusCode: 500, message: 'Failed to retrieve populated country info' });
            }
    
            const populatedCountry = countryId as any;

        return {
            student: studentUnderSchool,
            school: populatedSchool,
            countryInfo: {
                name: populatedCountry.name,
                code: populatedCountry.countryCode,
                registrationNumber: populatedCountry.registrationNumber
            },
            
        };

    } catch (error) {
        logger.error('❌ Error in registerStudentService', {
            error: (error as Error).message,
            firstName,
            schoolName: schoolName,
            countryName
        });

        throw error instanceof ApiError ? error : new Error('Failed to register student');
    }
};

const updateStudentLevel = async(userId: string, data: IStudentDocument) => {

    const { level } = data;

    const existingStudent  = await Student.findOne({ userId }).populate('firstName lastName level') as (IStudentDocument & Document) | null;

    if (!existingStudent) {
        throw new ApiError({ statusCode: 404, message: 'Student not found' });
    }

    if (existingStudent.level === level) {
        throw new ApiError({ statusCode: 401, message: 'select new level'})
    }

    existingStudent.level = level!
    await existingStudent.save();

    return {
        student: existingStudent
    }
}
export {
    registerStudentService,
    updateStudentLevel
}