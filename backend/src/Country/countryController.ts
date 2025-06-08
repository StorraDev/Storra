import { asyncHandler } from '../utils/AsyncHandler';
import { Request, Response } from 'express';
import { Country } from './countryModel';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { generateAccessAndRefreshToken } from '../utils/generateTokens';
import { logger } from '../utils/logger';
import { registerCountryService, getCountryInfo } from './countryService';
import jwt from 'jsonwebtoken';

export const registerCountry = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  // Validate required fields
  if ([name, email, password].some(field => !field?.trim())) {
    logger.error("Registration failed: Name, email, and password are required");
    throw new ApiError({ 
      statusCode: 400, 
      message: "Name, email, and password are required" 
    });
  }

  try {
    // Use the service to register the country
    const { country, countryData } = await registerCountryService({
      name: name.trim(),
      email: email.trim(),
      password: password.trim()
    });

    // Assert type for country to fix unknown _id
    const typedCountry = country as { _id: { toString: () => string } };

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      typedCountry._id.toString(), 
      "country"
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
    const countryResponse = {
      _id: country._id,
      name: country.name,
      email: country.email,
      countryCode: country.countryCode,
      registrationNumber: country.registrationNumber,
      isVerified: country.isVerified,
      userType: country.userType,
      createdAt: country.createdAt,
      updatedAt: country.updatedAt,
      // Include country data from JSON
      countryInfo: {
        officialName: countryData.officialName,
        alpha2: countryData.alpha2,
        alpha3: countryData.alpha3
      }
    };

    logger.info(`✅ Country registered successfully: ${country.name} - ${country.registrationNumber}`);
    console.log(accessToken, refreshToken);
    res
      .status(201)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)
      .json(new ApiResponse(
        201, 
        "Country registered successfully", 
        countryResponse
      ));

  } catch (error) {
    logger.error('❌ Country registration failed:', { 
      error: (error as Error).message,
      name,
      email 
    });

    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message.includes('not found in our database')) {
        throw new ApiError({
          statusCode: 400,
          message: "Country not found in our database. Please check the country name."
        });
      } else if (error.message.includes('already registered')) {
        throw new ApiError({
          statusCode: 409,
          message: error.message
        });
      } else if (error.message.includes('Email already registered')) {
        throw new ApiError({
          statusCode: 409,
          message: "This email is already registered"
        });
      } else {
        throw new ApiError({
          statusCode: 500,
          message: "Registration failed. Please try again later."
        });
      }
    } else {
      throw new ApiError({
        statusCode: 500,
        message: "Registration failed. Please try again later."
      });
    }
  }
});

export const loginCountry = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email?.trim() || !password?.trim()) {
    throw new ApiError({
      statusCode: 400,
      message: "Email and password are required"
    });
  }

  try {
    // Find country
    const country = await Country.findOne({ 
      email: email.trim().toLowerCase() 
    });
    
    if (!country) {
      throw new ApiError({
        statusCode: 401,
        message: "Invalid email or password"
      });
    }

    // Check password
    const isPasswordValid = await country.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new ApiError({
        statusCode: 401,
        message: "Invalid email or password"
      });
    }

    
    const typedCountry = country as { _id: { toString: () => string } };

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      typedCountry._id.toString(), 
      "country"
    );

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none" as const,
      maxAge: 60 * 60 * 1000, // 1 hour
      path: "/",
    };

    // Remove sensitive data from response
    const countryResponse = {
      _id: country._id,
      name: country.name,
      email: country.email,
      countryCode: country.countryCode,
      registrationNumber: country.registrationNumber,
      isVerified: country.isVerified,
      userType: country.userType,
      createdAt: country.createdAt,
      updatedAt: country.updatedAt
    };

    logger.info(`✅ Country logged in successfully: ${country.name} - ${country.registrationNumber}`);

    res
      .status(200)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)
      .json(new ApiResponse(200, "Login successful", countryResponse));

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('❌ Country login failed:', { 
      error: (error as Error).message,
      email 
    });
    
    throw new ApiError({
      statusCode: 500,
      message: "Login failed. Please try again later."
    });
  }
});
export const logoutCountry = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user._id) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }
  const userId = req.user._id;
  const country = await Country.findById(userId);

  if (!country) {
    throw new ApiError({ statusCode: 401, message: "Country not found" });
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none" as const,
    expires: new Date(0),
    path: "/",
  };

  res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, "Country logged out successfully", {}));
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

    const country = await Country.findById(decoded._id);
    if (!country || incomingRefreshToken !== country.refreshToken) {
      throw new ApiError({ statusCode: 401, message: "Invalid or expired refresh token" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(decoded._id, "country");

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
});

export const checkCountryInfo = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;

  if (!name?.trim()) {
    throw new ApiError({
      statusCode: 400,
      message: "Country name is required"
    });
  }

  try {
    const countryInfo = await getCountryInfo(name.trim());
    
    res.status(200).json(new ApiResponse(
      200, 
      "Country information retrieved successfully", 
      countryInfo
    ));
  } catch (error) {
    logger.error('❌ Error getting country info:', { 
      error: (error as Error).message,
      countryName: name 
    });

    if (error instanceof Error && error.message.includes('not found')) {
      throw new ApiError({
        statusCode: 404,
        message: "Country not found in our database"
      });
    }

    throw new ApiError({
      statusCode: 500,
      message: "Failed to retrieve country information"
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

  const country = await Country.findById(userId);
  if (!country) {
    throw new ApiError({ statusCode: 404, message: "Country not found" });
  }

  const isOldPasswordValid = await country.comparePassword(oldPassword);
  if (!isOldPasswordValid) {
    throw new ApiError({ statusCode: 401, message: "Old password is incorrect" });
  }

  country.password = newPassword;
  await country.save();

  res.status(200).json(new ApiResponse(200, "Password updated successfully", {}));
});
export const getCountryProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }

  const country = await Country.findById(userId).select('-password -refreshToken');
  if (!country) {
    throw new ApiError({ statusCode: 404, message: "Country not found" });
  }

  res.status(200).json(new ApiResponse(200, "Country profile retrieved successfully", country));
});

export const updateCountryProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }

  const { name, email } = req.body;

  if (!name?.trim() || !email?.trim()) {
    throw new ApiError({
      statusCode: 400,
      message: "Name and email are required"
    });
  }

  const country = await Country.findById(userId);
  if (!country) {
    throw new ApiError({ statusCode: 404, message: "Country not found" });
  }

  country.name = name.trim();
  country.email = email.trim().toLowerCase();
  
  await country.save();

  res.status(200).json(new ApiResponse(200, "Country profile updated successfully", country));
});

export const getAllCountries = asyncHandler(async (req: Request, res: Response) => {
  try {
    const countries = await Country.find().select('-password -refreshToken');
    
    if (countries.length === 0) {
      throw new ApiError({ statusCode: 404, message: "No countries found" });
    }

    res.status(200).json(new ApiResponse(200, "Countries retrieved successfully", countries));
  } catch (error) {
    logger.error('❌ Error retrieving countries:', { 
      error: (error as Error).message 
    });

    throw new ApiError({
      statusCode: 500,
      message: "Failed to retrieve countries"
    });
  }
});
export const deleteCountry = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Unauthorized - User not found" });
  }

  const country = await Country.findByIdAndDelete(userId);
  if (!country) {
    throw new ApiError({ statusCode: 404, message: "Country not found" });
  }

  res.status(200).json(new ApiResponse(200, "Country deleted successfully", {}));
});

export const registerSchool = asyncHandler(async (req: Request, res: Response) => {
  throw new ApiError({
    statusCode: 501,
    message: "This feature is not implemented yet"
  });
});