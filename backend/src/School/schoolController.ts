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
import jwt from 'jsonwebtoken';


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

export const loginSchool = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // validate required fields
    if(!email || !password) {
        logger.error("School login failed: Email and password are required");
        throw new ApiError({ 
            statusCode: 400, 
            message: "Email and password are required" 
        });
    }

    try {
        const existingSchool = await School.findOne({ email: email.toLowerCase() })
            .select('+password +refreshToken');

        if (!existingSchool) {
            logger.error("School login failed: School not found");
            throw new ApiError({ 
                statusCode: 404, 
                message: "School not found" 
            });
        }

        // Check password
        const isPasswordValid  = await existingSchool.comparePassword(password);
            if (!isPasswordValid) {
                logger.error("School login failed: Invalid password");
                throw new ApiError({ 
                    statusCode: 401, 
                    message: "Invalid password" 
                });
            }
        
        // Generate tokens
        const school = existingSchool as { _id: { toString: () => string } };
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
            school._id.toString(), 
            "school"
        );  

        // Cookie options

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none" as const,
            maxAge: 60 * 60 * 1000, // 1 hour
        }

        const schoolResponse = {
            _id: existingSchool._id,
            name: existingSchool.name,
            email: existingSchool.email,
            countryCode: existingSchool.countryCode,
            registrationNumber: existingSchool.registrationNumber,
            address: existingSchool.address,
            createdAt: existingSchool.createdAt,
            updatedAt: existingSchool.updatedAt,
        }

        logger.info(`✅ School logged in successfully: ${existingSchool.name} - ${existingSchool.registrationNumber}`);
        res
            .status(200)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .cookie("accessToken", accessToken, cookieOptions)
            .json(new ApiResponse(
                200, 
                "School logged in successfully", 
                schoolResponse
            ));

    } catch (error) {
        logger.error('❌ School login failed:', {
            error: (error as Error).message,    
            email
        });
    }
})


export const logoutSchool = asyncHandler(async (req: Request, res: Response) => {
    if(!req.user || !req.user._id) {
        logger.error("School logout failed: User not authenticated");
        throw new ApiError({ 
            statusCode: 401, 
            message: "User not authenticated" 
        });
    }

    const userId = req.user._id.toString();
    const school = await School.findById(userId).select('+refreshToken');

    if(!school) {
        logger.error("School logout failed: School not found");
        throw new ApiError({ 
            statusCode: 404, 
            message: "School not found" 
        });
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none" as const,
        maxAge: 0, // Expire immediately
    }

    res 
        .status(200)
        .clearCookie("refreshToken", cookieOptions)
        .clearCookie("accessToken", cookieOptions)
        .json(new ApiResponse(
            200, 
            "School logged out successfully", 
            {}
        ));
});


export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
      if (!incomingRefreshToken) {
        throw new ApiError({ statusCode: 401, message: "Unauthorized - No refresh token provided" });
      }
    
      interface TokenPayload extends jwt.JwtPayload {
        _id: string;
      }
    
      try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET!) as TokenPayload;
    
        const country = await School.findById(decoded._id);
        if (!country || incomingRefreshToken !== country.refreshToken) {
          throw new ApiError({ statusCode: 401, message: "Invalid or expired refresh token" });
        }
    
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(decoded._id, "school");
    
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "none" as const,
          maxAge: 60 * 60 * 1000,
          path: "/",
        };
    
        res
          .status(200)
          .cookie("accessToken", accessToken, cookieOptions)
          .cookie("refreshToken", refreshToken, cookieOptions)
          .json(new ApiResponse(200, "Access token refreshed", { accessToken, refreshToken }));
      } catch (err) {
        throw new ApiError({ statusCode: 401, message: "Invalid or expired token" });
      }
})

export const checkSchoolInfo = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;

  if (!name?.trim()) {
    throw new ApiError({
      statusCode: 400,
      message: "School name is required"
    });
  }

  try {
    const schoolInfo = await getSchoolInfo(name.trim());
    
    res.status(200).json(new ApiResponse(
      200, 
      "School information retrieved successfully", 
      schoolInfo
    ));
  } catch (error) {
    logger.error('❌ Error getting school info:', { 
      error: (error as Error).message,
      schoolName: name 
    });

    if (error instanceof Error && error.message.includes('not found')) {
      throw new ApiError({
        statusCode: 404,
        message: "School not found in our database"
      });
    }

    throw new ApiError({
      statusCode: 500,
      message: "Failed to retrieve school information"
    });
  }
});

export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword?.trim() || !newPassword?.trim()) {
    throw new ApiError({
      statusCode: 400,
      message: "Old password and new password are required"
    });
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }

  const school = await School.findById(userId);
  if (!school) {
    throw new ApiError({ statusCode: 404, message: "School not found" });
  }

  const isOldPasswordValid = await school.comparePassword(oldPassword);
  if (!isOldPasswordValid) {
    throw new ApiError({ statusCode: 401, message: "Old password is incorrect" });
  }

  school.password = newPassword;
  await school.save();

  res.status(200).json(new ApiResponse(200, "Password updated successfully", {}));
});
export const getSchoolProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }

  const school = await School.findById(userId).select('-password -refreshToken');
  if (!school) {
    throw new ApiError({ statusCode: 404, message: "School not found" });
  }

  res.status(200).json(new ApiResponse(200, "School profile retrieved successfully", school));
});

export const updateSchoolProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }

  const { name, email } = req.body;

  if (!name?.trim() && !email?.trim()) {
    throw new ApiError({
      statusCode: 400,
      message: "At least one of name or email is required to update"
    });
  }

  const school = await School.findById(userId);

  if (!school) {
    throw new ApiError({ statusCode: 404, message: "School not found" });
  }

  if (name?.trim()) {
    school.name = name.trim();
  }

  if (email?.trim()) {
    school.email = email.trim().toLowerCase();
  }

  await school.save();

  res.status(200).json(new ApiResponse(200, "School profile updated successfully", school));
});

export const getAllSchools = asyncHandler(async (req: Request, res: Response) => {
  try {
    const schools = await School.find().select('-password -refreshToken');
    
    if (schools.length === 0) {
      throw new ApiError({ statusCode: 404, message: "No school found" });
    }

    res.status(200).json(new ApiResponse(200, "Schools retrieved successfully", schools));
  } catch (error) {
    logger.error('❌ Error retrieving schools:', { 
      error: (error as Error).message 
    });

    throw new ApiError({
      statusCode: 500,
      message: "Failed to retrieve schools"
    });
  }
});
export const deleteSchool = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }

  const school = await School.findByIdAndDelete(userId);
  if (!school) {
    throw new ApiError({ statusCode: 404, message: "School not found" });
  }

  res.status(200).json(new ApiResponse(200, "School deleted successfully", {}));
});

