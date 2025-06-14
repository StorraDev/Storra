import { asyncHandler } from '../utils/AsyncHandler';
import { Request, Response } from 'express';
import { Student } from './studentModel';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { generateAccessAndRefreshToken } from '../utils/generateTokens';
import { logger } from '../utils/logger';
import { 
    registerStudentService,
    getStudentInfo
} from './studentService';
import jwt from 'jsonwebtoken';


export const registerStudent = asyncHandler(async (req: Request, res: Response) => {
    const { 
       firstName, 
       lastName, 
       email, 
       password, 
       address, 
       phone, 
       countryName, 
       schoolName, 
       dateOfBirth, 
       level,
       gender
    } = req.body;

    // Validate required fields
    const requiredFields = [firstName, lastName, email, password, gender, address, phone, countryName, schoolName, dateOfBirth, level];
    if (requiredFields.some(field => !field || (typeof field === 'string' && !field.trim()))) {
        logger.error("student registration failed: All required fields must be provided");
        throw new ApiError({ 
            statusCode: 400, 
            message: "firstName, lastName, email, password, address, phone, countryName, schoolName, dateOfBirth, level" 
        });
    }

    try {
        // Use the service to register the student
        const { student, school, countryInfo } = await registerStudentService({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password: password.trim(),
            address: address.trim(),
            phone: phone.trim(),
            countryName: countryName.trim(),
            schoolName: schoolName.trim(),
            dateOfBirth: dateOfBirth.trim(),
            level: level.trim(),
            gender: gender.trim()
        });

        // Generate tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
            (student as { _id: { toString: () => string } })._id.toString(), 
            "student"
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
        const studentResponse = {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            gender: student.gender,
            schoolName: school.name,
            countryName: countryInfo.name,
            registrationNumber: student.registrationNumber,
            address: student.address,
            phone: student.phone,
            level: student.level,
            isActive: student.isActive,
            isVerified: student.isVerified,
            userType: student.userType,
            createdAt: student.createdAt,
            updatedAt: student.updatedAt,
        };

        logger.info(`✅ student registered successfully: ${student.firstName} ${student.lastName} - ${student.registrationNumber}`);
        
        res
            .status(201)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .cookie("accessToken", accessToken, cookieOptions)
            .json(new ApiResponse(
                201, 
                "student registered successfully", 
                studentResponse
            ));

    } catch (error) {
        logger.error('❌ student registration failed:', { 
            error: (error as Error).message,
            firstName,
            email,
            schoolName,
            countryName
        });

        // Handle specific service errors
        if (error instanceof Error) {
            if (error.message.includes('Student not found')) {
                throw new ApiError({
                    statusCode: 404,
                    message: "Country not found. Please verify the Student ID."
                });
            } else if (error.message.includes('Student must be verified')) {
                throw new ApiError({
                    statusCode: 403,
                    message: "Student must be verified before students can register"
                });
            } else if (error.message.includes('Email already registered')) {
                throw new ApiError({
                    statusCode: 409,
                    message: "This email is already registered"
                });
            } else if (error.message.includes('Invalid student levels')) {
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
                            message: "An unexpected error occurred during student registration"
                        });
                    }
                }
                throw error;
            }
        
});

export const loginstudent = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // validate required fields
    if(!email || !password) {
        logger.error("student login failed: Email and password are required");
        throw new ApiError({ 
            statusCode: 400, 
            message: "Email and password are required" 
        });
    }

    try {
        const existingStudent = await Student.findOne({ email: email.toLowerCase() })
            .select('+password +refreshToken')

        if (!existingStudent) {
            logger.error("student login failed: student not found");
            throw new ApiError({ 
                statusCode: 404, 
                message: "student not found" 
            });
        }

        // Check password
        const isPasswordValid  = await existingStudent.comparePassword(password);
        if (!isPasswordValid) {
            logger.error("student login failed: Invalid password");
            throw new ApiError({ 
                statusCode: 401, 
                message: "Invalid password" 
            });
        }
        
        // Generate tokens
        const student = existingStudent as { _id: { toString: () => string } };
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
            student._id.toString(), 
            "student"
        );  

        // Cookie options

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none" as const,
            maxAge: 60 * 60 * 1000, // 1 hour
        }

        const studentResponse = {
            _id: existingStudent._id,
            firstName: existingStudent.firstName,
            email: existingStudent.email,
            schoolName: existingStudent.schoolName,
            countryName: existingStudent.countryName,
            registrationNumber: existingStudent.registrationNumber,
            level: existingStudent.level,
            address: existingStudent.address,
            createdAt: existingStudent.createdAt,
            updatedAt: existingStudent.updatedAt,
        }

        logger.info(`✅ student logged in successfully: ${existingStudent.firstName} - ${existingStudent.registrationNumber}`);
        res
            .status(200)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .cookie("accessToken", accessToken, cookieOptions)
            .json(new ApiResponse(
                200, 
                "student logged in successfully", 
                studentResponse
            ));

    } catch (error) {
        logger.error('❌ student login failed:', {
            error: (error as Error).message,    
            email
        });
    }
})


export const logoutstudent = asyncHandler(async (req: Request, res: Response) => {
    if(!req.user || !req.user._id) {
        logger.error("student logout failed: User not authenticated");
        throw new ApiError({ 
            statusCode: 401, 
            message: "User not authenticated" 
        });
    }

    const userId = req.user._id.toString();
    const student = await Student.findById(userId).select('+refreshToken');

    if(!student) {
        logger.error("Student logout failed: Student not found");
        throw new ApiError({ 
            statusCode: 404, 
            message: "Student not found" 
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
            "Student logged out successfully", 
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
    
        const country = await Student.findById(decoded._id);
        if (!country || incomingRefreshToken !== country.refreshToken) {
          throw new ApiError({ statusCode: 401, message: "Invalid or expired refresh token" });
        }
    
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(decoded._id, "student");
    
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

export const checkStudentInfo = asyncHandler(async (req: Request, res: Response) => {
  const { registrationNumber } = req.params;

  if (!registrationNumber) {
    throw new ApiError({
      statusCode: 400,
      message: "student registration number is required"
    });
  }

  try {
    const studentInfo = await getStudentInfo(registrationNumber.trim());
    res.status(200).json(new ApiResponse(
      200, 
      "student information retrieved successfully", 
      studentInfo
    ));
  } catch (error) {
    logger.error('❌ Error getting student info:', { 
      error: (error as Error).message,
      registrationNumber
    });

    if (error instanceof Error && error.message.includes('not found')) {
      throw new ApiError({
        statusCode: 404,
        message: "student not found in our database"
      });
    }

    throw new ApiError({
      statusCode: 500,
      message: "Failed to retrieve student information"
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

  const student = await Student.findById(userId);
  if (!student) {
    throw new ApiError({ statusCode: 404, message: "student not found" });
  }

  const isOldPasswordValid = await student.comparePassword(oldPassword);
  if (!isOldPasswordValid) {
    throw new ApiError({ statusCode: 401, message: "Old password is incorrect" });
  }

  student.password = newPassword;
  await student.save();

  res.status(200).json(new ApiResponse(200, "Password updated successfully", {}));
});
export const getStudentProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }

  const student = await Student.findById(userId).select('-password -refreshToken');
  if (!student) {
    throw new ApiError({ statusCode: 404, message: "student not found" });
  }

  res.status(200).json(new ApiResponse(200, "student profile retrieved successfully", student));
});

export const updateStudentProfile = asyncHandler(async (req: Request, res: Response) => {
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

  const student = await Student.findById(userId);

  if (!student) {
    throw new ApiError({ statusCode: 404, message: "student not found" });
  }

  if (firstName?.trim()) {
    student.firstName = firstName.trim();
  }

  if(lastName?.trim()) {
    student.lastName = lastName.trim();
  }

  if (email?.trim()) {
    student.email = email.trim().toLowerCase();
  }

  await student.save();

  res.status(200).json(new ApiResponse(200, "student profile updated successfully", student));
});

