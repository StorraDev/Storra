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

  if (!email || !password) {
    throw new ApiError({ statusCode: 400, message: "Email and password are required" });
  }

  const country = await Country.findOne({ email }) as typeof Country.prototype;
  if (!country) {
    throw new ApiError({ statusCode: 401, message: "Invalid credentials" });
  }

  const isMatch = await country.comparePassword(password);
  if (!isMatch) {
    throw new ApiError({ statusCode: 401, message: "Incorrect password" });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(country._id.toString(), "country");
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none" as const,
    maxAge: 60 * 60 * 1000,
    path: "/",
  };

  res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(200, "Country logged in successfully", country));
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
