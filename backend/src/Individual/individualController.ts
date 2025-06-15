import { asyncHandler } from '../utils/AsyncHandler';
import { Request, Response } from 'express';
import { Individual } from './indvidualModel';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { generateAccessAndRefreshToken } from '../utils/generateTokens';
import { logger } from '../utils/logger';
import { 
    registerIndividualService,
    getIndividualInfo
} from './individualService';
import jwt from 'jsonwebtoken';


export const registerIndividual = asyncHandler(async (req: Request, res: Response) => {
    const { 
       firstName, 
       lastName, 
       email, 
       password, 
       address, 
       phone, 
       countryName, 
       dateOfBirth, 
       level,
       gender
    } = req.body;

    const requiredFields = [firstName, lastName, email, password, gender, address, phone, countryName, dateOfBirth, level];
    if (requiredFields.some(field => !field || (typeof field === 'string' && !field.trim()))) {
        logger.error("Individual registration failed: All required fields must be provided");
        throw new ApiError({ 
            statusCode: 400, 
            message: "firstName, lastName, email, password, address, phone, countryName, dateOfBirth, level" 
        });
    }

    try {
        
        const { individual, country } = await registerIndividualService({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password: password.trim(),
            address: address.trim(),
            phone: phone.trim(),
            countryName: countryName.trim(),
            dateOfBirth: dateOfBirth.trim(),
            level: level.trim(),
            gender: gender.trim()
        });

        // Generate tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
            (individual as { _id: { toString: () => string } })._id.toString(), 
            "individual"
        );

        // Cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none" as const,
            maxAge: 60 * 60 * 1000, // 1 hour
            path: "/",
        };

        const individualResponse = {
            _id: individual._id,
            firstName: individual.firstName,
            lastName: individual.lastName,
            email: individual.email,
            dateOfBirth: individual.dateOfBirth,
            gender: individual.gender,
            countryName: country.name,
            registrationNumber: individual.registrationNumber,
            address: individual.address,
            phone: individual.phone,
            level: individual.level,
            isActive: individual.isActive,
            isVerified: individual.isVerified,
            userType: individual.userType,
            createdAt: individual.createdAt,
            updatedAt: individual.updatedAt,
        };

        logger.info(`✅ individual registered successfully: ${individual.firstName} ${individual.lastName} - ${individual.registrationNumber}`);
        
        res
            .status(201)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .cookie("accessToken", accessToken, cookieOptions)
            .json(new ApiResponse(
                201, 
                "individual registered successfully", 
                individualResponse
            ));

    } catch (error) {
        logger.error('❌ individual registration failed:', { 
            error: (error as Error).message,
            firstName,
            email,
            countryName
        });

        // Handle specific service errors
        if (error instanceof Error) {
            if (error.message.includes('Individual not found')) {
                throw new ApiError({
                    statusCode: 404,
                    message: "Country not found. Please verify the Individual ID."
                });
            } else if (error.message.includes('Individual must be verified')) {
                throw new ApiError({
                    statusCode: 403,
                    message: "Individual must be verified before individuals can register"
                });
            } else if (error.message.includes('Email already registered')) {
                throw new ApiError({
                    statusCode: 409,
                    message: "This email is already registered"
                });
            } else if (error.message.includes('Invalid individual levels')) {
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
                            message: "An unexpected error occurred during individual registration"
                        });
                    }
                }
                throw error;
            }
        
});

export const loginIndividual = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // validate required fields
    if(!email || !password) {
        logger.error("individual login failed: Email and password are required");
        throw new ApiError({ 
            statusCode: 400, 
            message: "Email and password are required" 
        });
    }

    try {
        const existingIndividual = await Individual.findOne({ email: email.toLowerCase() })
            .select('+password +refreshToken')

        if (!existingIndividual) {
            logger.error("individual login failed: individual not found");
            throw new ApiError({ 
                statusCode: 404, 
                message: "individual not found" 
            });
        }

        // Check password
        const isPasswordValid  = await existingIndividual.comparePassword(password);
        if (!isPasswordValid) {
            logger.error("individual login failed: Invalid password");
            throw new ApiError({ 
                statusCode: 401, 
                message: "Invalid password" 
            });
        }
        
        // Generate tokens
        const individual = existingIndividual as { _id: { toString: () => string } };
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
            individual._id.toString(), 
            "individual"
        );  

        // Cookie options

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none" as const,
            maxAge: 60 * 60 * 1000, // 1 hour
        }

        const individualResponse = {
            _id: existingIndividual._id,
            firstName: existingIndividual.firstName,
            email: existingIndividual.email,
            countryName: existingIndividual.countryName,
            registrationNumber: existingIndividual.registrationNumber,
            level: existingIndividual.level,
            address: existingIndividual.address,
            createdAt: existingIndividual.createdAt,
            updatedAt: existingIndividual.updatedAt,
        }

        logger.info(`✅ individual logged in successfully: ${existingIndividual.firstName} - ${existingIndividual.registrationNumber}`);
        res
            .status(200)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .cookie("accessToken", accessToken, cookieOptions)
            .json(new ApiResponse(
                200, 
                "individual logged in successfully", 
                individualResponse
            ));

    } catch (error) {
        logger.error('❌ individual login failed:', {
            error: (error as Error).message,    
            email
        });
    }
})


export const logoutIndividual = asyncHandler(async (req: Request, res: Response) => {
    if(!req.user || !req.user._id) {
        logger.error("individual logout failed: User not authenticated");
        throw new ApiError({ 
            statusCode: 401, 
            message: "User not authenticated" 
        });
    }

    const userId = req.user._id.toString();
    const individual = await Individual.findById(userId).select('+refreshToken');

    if(!individual) {
        logger.error("Individual logout failed: Individual not found");
        throw new ApiError({ 
            statusCode: 404, 
            message: "Individual not found" 
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
            "Individual logged out successfully", 
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
    
        const country = await Individual.findById(decoded._id);
        if (!country || incomingRefreshToken !== country.refreshToken) {
          throw new ApiError({ statusCode: 401, message: "Invalid or expired refresh token" });
        }
    
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(decoded._id, "individual");
    
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

export const checkIndividualInfo = asyncHandler(async (req: Request, res: Response) => {
  const { registrationNumber } = req.params;

  if (!registrationNumber) {
    throw new ApiError({
      statusCode: 400,
      message: "individual registration number is required"
    });
  }

  try {
    const individualInfo = await getIndividualInfo(registrationNumber.trim());
    res.status(200).json(new ApiResponse(
      200, 
      "individual information retrieved successfully", 
      individualInfo
    ));
  } catch (error) {
    logger.error('❌ Error getting individual info:', { 
      error: (error as Error).message,
      registrationNumber
    });

    if (error instanceof Error && error.message.includes('not found')) {
      throw new ApiError({
        statusCode: 404,
        message: "individual not found in our database"
      });
    }

    throw new ApiError({
      statusCode: 500,
      message: "Failed to retrieve individual information"
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

  const individual = await Individual.findById(userId);
  if (!individual) {
    throw new ApiError({ statusCode: 404, message: "individual not found" });
  }

  const isOldPasswordValid = await individual.comparePassword(oldPassword);
  if (!isOldPasswordValid) {
    throw new ApiError({ statusCode: 401, message: "Old password is incorrect" });
  }

  individual.password = newPassword;
  await individual.save();

  res.status(200).json(new ApiResponse(200, "Password updated successfully", {}));
});
export const getIndividualProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }

  const individual = await Individual.findById(userId).select('-password -refreshToken');
  if (!individual) {
    throw new ApiError({ statusCode: 404, message: "individual not found" });
  }

  res.status(200).json(new ApiResponse(200, "individual profile retrieved successfully", individual));
});

export const updateIndividualProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }

  const { firstName, lastName, email } = req.body;

  if (!firstName?.trim() && !lastName?.trim() && !email?.trim()) {
    throw new ApiError({
      statusCode: 400,
      message: "At least one of name or email is required to update"
    });
  }

  const individual = await Individual.findById(userId);

  if (!individual) {
    throw new ApiError({ statusCode: 404, message: "individual not found" });
  }

  if (firstName?.trim()) {
    individual.firstName = firstName.trim();
  }

  if(lastName?.trim()) {
    individual.lastName = lastName.trim();
  }

  if (email?.trim()) {
    individual.email = email.trim().toLowerCase();
  }

  await individual.save();

  res.status(200).json(new ApiResponse(200, "individual profile updated successfully", individual));
});

