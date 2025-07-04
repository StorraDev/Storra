import { Country } from '../Country/countryModel';
import { School } from '../School/schoolModel';
import { Student } from '../Student/studentModel';
import { Individual } from '../Individual/indvidualModel'
import { Parent } from '../Parent/parentModel';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/AsyncHandler';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import { logger } from '../utils/logger';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        userType: UserType;
        [key: string]: any;
      };
    }
  }
}

// Type-safe user type
type UserType = 'country' | 'school' | 'student' | 'individual' | 'parent';

// Interface for JWT payload
interface JWTPayload extends jwt.JwtPayload {
  _id: string;
  userType: UserType;
}

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔍 Extracted token from:', {
  cookies: req.cookies?.accessToken,
  headers: req.header('Authorization'),
});

    
    logger.info('🔍 Token received:', { status: token ? 'Present' : 'Missing' });
        
    if (!token) {
      throw new ApiError({
        statusCode: 401,
        message: 'Access token is required'
      });
    }

    // Verify and decode the token
    const decoded = jwt.verify(
      token, 
      process.env.ACCESS_TOKEN_SECRET!
    ) as JWTPayload;

    console.log('🔍 Decoded token:', {
      userId: decoded._id,
      userType: decoded.userType
    });

    // Model mapping for different user types
    const modelMap = {
      country: Country,
      school: School,
      student: Student,
      individual: Individual,
      parent: Parent
    } as const;

    // Only allow userType values that exist in modelMap
    type ModelMapKey = keyof typeof modelMap;

    if (!Object.prototype.hasOwnProperty.call(modelMap, decoded.userType)) {
      throw new ApiError({
        statusCode: 401,
        message: 'Invalid user type in token'
      });
    }

    // Get the appropriate model based on user type
    const UserModel = modelMap[decoded.userType as ModelMapKey];

    if (!UserModel) {
      throw new ApiError({
        statusCode: 401,
        message: 'Invalid user type in token'
      });
    }

    // Find the user in the appropriate collection
    const user = await (UserModel as typeof Country)
      .findById(decoded._id)
      .select('-password -refreshToken');

    if (!user) {
      throw new ApiError({
        statusCode: 401,
        message: 'User not found or token is invalid'
      });
    }

    

    // Attach user to request object with userType
    const userObj = user.toObject();
    req.user = {
      ...userObj,
      _id: String(userObj._id),
      userType: decoded.userType
    };

    console.log('✅ User authenticated:', {
      userId: req.user?._id,
      userType: req.user?.userType
    });

    next();
    
  } catch (error) {
    console.error('❌ JWT Verification failed:', error);
        
    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError({
        statusCode: 401,
        message: 'Invalid access token'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError({
        statusCode: 401,
        message: 'Access token has expired'
      });
    } else if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError({
        statusCode: 401,
        message: 'Authentication failed'
      });
    }
  }
});

// FIXED: Proper error handling to prevent app crashes
export const verifyCountryJWT: RequestHandler = asyncHandler(async (req, res, next) => {
  // First run the general JWT verification
  await new Promise<void>((resolve, reject) => {
    verifyJWT(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Then check if user is a country
  if (req.user?.userType !== 'country') {
    throw new ApiError({
      statusCode: 403,
      message: 'Access restricted to countries only'
    });
  }
  
  next();
});

export const verifySchoolJWT: RequestHandler = asyncHandler(async (req, res, next) => {
  await verifyJWT(req, res, () => {
    if (req.user?.userType !== 'school') {
      throw new ApiError({ 
        statusCode: 403, 
        message: 'Access restricted to schools only' 
      });
    }
    next();
  });
});

export const verifyStudentJWT: RequestHandler = asyncHandler(async (req, res, next) => {
  await verifyJWT(req, res, () => {
    if (req.user?.userType !== 'student') {
      throw new ApiError({ 
        statusCode: 403, 
        message: 'Access restricted to students only' 
      });
    }
    next();
  });
});

export const verifyIndividualJWT: RequestHandler = asyncHandler(async (req, res, next) => {
  await verifyJWT(req, res, () => {
    if (req.user?.userType !== 'individual') {
      throw new ApiError({ 
        statusCode: 403, 
        message: 'Access restricted to individuals only' 
      });
    }
    next();
  });
});

export const verifyParentJWT: RequestHandler = asyncHandler(async (req, res, next) => {
  await verifyJWT(req, res, () => {
    if (req.user?.userType !== 'parent') {
      throw new ApiError({ 
        statusCode: 403, 
        message: 'Access restricted to parents only' 
      });
    }
    next();
  });
});

// Helper function to check multiple user types
export const verifyUserTypes = (allowedTypes: UserType[]): RequestHandler => {
  return asyncHandler(async (req, res, next) => {
    await verifyJWT(req, res, () => {
      if (!allowedTypes.includes(req.user?.userType as UserType)) {
        throw new ApiError({ 
          statusCode: 403, 
          message: `Access restricted to: ${allowedTypes.join(', ')}` 
        });
      }
      next();
    });
  });
};
