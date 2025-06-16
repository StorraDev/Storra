import { Document } from 'mongoose';
import { Individual } from './indvidualModel'
import { Country } from '../Country/countryModel';
import { logger } from '../utils/logger';
import { client as redis } from '../config/redis/redis';
import { getNextIndividualCounter } from '../config/redis/redisIndividualCounter';
import { IIndividualDocument, IIndividualRegistration } from '../types/individualTypes';
import { ApiError } from '../utils/ApiError'
import { getAge } from '../utils/getAge'

const registerIndividualService = async (data: IIndividualRegistration) => {
    const { firstName, lastName, email, password, gender, address, phone, countryName, dateOfBirth, level   } = data;

    try {
        // 1. Validate and get country
        const country = await Country.findOne({ name: { $regex: new RegExp(`^${countryName.trim()}$`, 'i') } });
        if (!country) {
            throw new Error('Country not found');
        }

    // 2. Check if individual email already exists
    const existingIndividual = await Individual.findOne({ email: email.toLowerCase() });
    if (existingIndividual) {
        logger.warn(`Individual with email ${email} already exists`);
        throw new Error('Email already registered');
    }

    // 3. Validate levels
    const allowedLevels = ['primary', 'secondary', 'tertiary'];

        // Ensure only one level is selected
        if (Array.isArray(level) && level.length > 1) {
            throw new Error('You can only select one school level');
        }

        const levelToUse = Array.isArray(level) ? level[0] : level;

        if (!allowedLevels.includes(levelToUse)) {
            throw new Error('Level must be primary, secondary, or tertiary');
        }

        // validate date of birth
       const parsedDOB = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;

        const age = getAge(parsedDOB);
        //const levelToUse = Array.isArray(level) ? level[0] : level;

        if (levelToUse === 'primary' && (age < 3 || age > 15)) {
            throw new Error('Primary level students should typically be between 3 and 15 years old');
        } else if (levelToUse === 'secondary' && (age < 10 || age > 24)) {
            throw new Error('Secondary level students should typically be between 10 and 24 years old');
        } else if (levelToUse === 'tertiary' && age < 16) {
            throw new Error('Tertiary level students should be 16 years or older');
        }

        // 5. Generate unique registration number
        const registrationNumber = await getNextIndividualCounter( country.registrationNumber);
        const individualNumber = parseInt(registrationNumber.split('IND')[1]);
        // 6. Create school
        const newIndividual = await Individual.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            password: password.trim(),
            gender,
            countryId: country._id,
            countryCode: country.countryCode,
            countryName,
            dateOfBirth: parsedDOB,
            level: levelToUse,
            registrationNumber,
            address: address.trim(),
            phone: phone.trim(),
            userType: 'individual',
            isVerified: false
        });

        await redis.set('global:individualCounter', individualNumber);

        // 7. Populate school info
        const individualUnderCountry = await Individual.findById(newIndividual._id).populate('countryId' );

        if (!individualUnderCountry || !individualUnderCountry.countryId) {
            throw new Error('Failed to retrieve populated country info');
        }

        const populatedCountry = individualUnderCountry.countryId as any;

        logger.info(`✅ Student registered: ${newIndividual.firstName} ${newIndividual.lastName} (${registrationNumber}) under ${populatedCountry.name}`);

        return {
            individual: individualUnderCountry,
            country: populatedCountry,
            
        };

    } catch (error) {
        logger.error('❌ Error in registerStudentService', {
            error: (error as Error).message,
            firstName,
            countryName
        });

        throw error instanceof ApiError ? error : new Error('Failed to register student');
    }
};

const getIndividualInfo = async (registrationNumber: string) => {
  try {
    const individual = await Individual.findOne({ registrationNumber })
      .select('-password');

    if (!individual) {
      throw new Error('Individual not found');
    }

    return individual;
  } catch (error) {
    logger.error('❌ Error in getIndividualInfo', { 
      error: (error as Error).message,
      registrationNumber
    });
    throw error;
  }
};

const updateIndividualLevel = async(userId: string, data: IIndividualDocument) => {

    const { level } = data;

    const existingIndividual  = await Individual.findOne({ userId }).populate('firstName lastName level') as (IIndividualDocument & Document) | null;

    if (!existingIndividual) {
        throw new ApiError({ statusCode: 404, message: 'Student not found' });
    }

    if (existingIndividual.level === level) {
        throw new ApiError({ statusCode: 401, message: 'select new level'})
    }

    existingIndividual.level = level!
    await existingIndividual.save();

    return {
        student: existingIndividual
    }
}


export { 
    registerIndividualService,
    getIndividualInfo,
    updateIndividualLevel
}