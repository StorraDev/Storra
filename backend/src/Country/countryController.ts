import { asyncHandler } from '../utils/AsyncHandler';
import { Request, Response } from 'express';
import { Country } from './countryModel';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { generateAccessAndRefreshToken } from '../utils/generateTokens';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

export const registerCountry = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password} = req.body;

  if ([name, email, password].some(field => !field?.trim())) {
    logger.error("Registration failed: All fields are required");
    throw new ApiError({ statusCode: 400, message: "All fields are required" });
  }

  const existingCountry = await Country.findOne({ email });
  if (existingCountry) {
    logger.error("Registration failed: Email is already in use");
    throw new ApiError({ statusCode: 409, message: "Email is already in use" });
  }

  const country = await Country.create({ name, email, password}) as typeof Country.prototype;

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(country._id.toString(), "country");

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none" as const,
    maxAge: 60 * 60 * 1000, // 1 hour
    path: "/",
  };

  res
    .status(201)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(201, "Country registered successfully", country));
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
