// School/schoolController.ts
import { asyncHandler } from '../utils/AsyncHandler';
import { Request, Response } from 'express';
import { School } from './schoolModel';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { generateAccessAndRefreshToken } from '../utils/generateTokens';
import { logger } from '../utils/logger';
import { 
    registerSchoolService, 
    getSchoolInfo, 
    updateSchoolSubscription, 
    getSchoolsByCountry 
} from './schoolService';

export const registerSchool = asyncHandler(async (req: Request, res: Response) => {
    const { 
        name, 
        email, 
        password, 
        countryName, 
        address, 
        phone, 
        schoolLevels, 
        subscriptionType = 'basic' 
    } = req.body;

    // Validate required fields
    const requiredFields = [name, email, password, countryName, address, phone, schoolLevels];
    if (requiredFields.some(field => !field || (typeof field === 'string' && !field.trim()))) {
        logger.error("School registration failed: All required fields must be provided");
        throw new ApiError({ 
            statusCode: 400, 
            message: "Name, email, password, countryId, address, phone, and schoolLevels are required" 
        });
    }

    // Validate school levels array
    if (!Array.isArray(schoolLevels) || schoolLevels.length === 0) {
        throw new ApiError({
            statusCode: 400,
            message: "At least one school level must be selected"
        });
    }

    try {
        // Use the service to register the school
        const { school, countryInfo, subscriptionInfo } = await registerSchoolService({
            name: name.trim(),
            email: email.trim(),
            password: password.trim(),
            countryName: countryName.trim(),
            address: address.trim(),
            phone: phone.trim(),
            schoolLevels,
            subscriptionType
        });

        // Generate tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
            (school as { _id: { toString: () => string } })._id.toString(), 
            "school"
        );

        // Cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none" as const,
            maxAge: 60 * 60 * 1000, // 1 hour
            path: "/",
        };

        // Prepare response data (exclude sensitive information)
        const schoolResponse = {
            _id: school._id,
            name: school.name,
            email: school.email,
            //countryId: school.countryId,
            countryCode: school.countryCode,
            registrationNumber: school.registrationNumber,
            address: school.address,
            phone: school.phone,
            schoolLevels: school.schoolLevels,
            subscriptionType: school.subscriptionType,
            maxStudents: school.maxStudents,
            currentStudents: school.currentStudents,
            isVerified: school.isVerified,
            userType: school.userType,
            createdAt: school.createdAt,
            updatedAt: school.updatedAt,
            // Include country and subscription info
            countryInfo,
            subscriptionInfo
        };

        logger.info(`✅ School registered successfully: ${school.name} - ${school.registrationNumber}`);
        
        res
            .status(201)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .cookie("accessToken", accessToken, cookieOptions)
            .json(new ApiResponse(
                201, 
                "School registered successfully", 
                schoolResponse
            ));

    } catch (error) {
        logger.error('❌ School registration failed:', { 
            error: (error as Error).message,
            name,
            email,
            countryName
        });

        // Handle specific service errors
        if (error instanceof Error) {
            if (error.message.includes('Country not found')) {
                throw new ApiError({
                    statusCode: 404,
                    message: "Country not found. Please verify the country ID."
                });
            } else if (error.message.includes('Country must be verified')) {
                throw new ApiError({
                    statusCode: 403,
                    message: "Country must be verified before schools can register"
                });
            } else if (error.message.includes('Email already registered')) {
                throw new ApiError({
                    statusCode: 409,
                    message: "This email is already registered"
                });
            } else if (error.message.includes('Invalid school levels')) {
                throw new ApiError({
                    statusCode: 400,
                    message: error.message
                });
            } else if (error.message.includes('Invalid subscription type')) {
                throw new ApiError({
                            statusCode: 400,
                            message: error.message
                        });
                    } else {
                        throw new ApiError({
                            statusCode: 500,
                            message: "An unexpected error occurred during school registration"
                        });
                    }
                }
                throw error;
            }
        });