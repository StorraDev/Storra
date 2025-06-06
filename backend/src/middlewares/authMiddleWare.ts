import { Country } from '../Country/countryModel';
import { ApiError } from '../utils/ApiError';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';

// Type-safe user type
type UserType = 'country' | 'school' | 'student' | 'individual';

export const verifyJWT: RequestHandler = async (req, _, next) => {
  const token = req.cookies?.accessToken || 
                req.header('Authorization')?.replace('Bearer ', '');

  if (!token) throw new ApiError({401, 'Unauthorized'});

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
      _id: string;
      userType: UserType;
    };

    const models = {
      country: Country,
    //   school: School,
    //   student: Student,
    //   individual: Individual
    };

    const user = await models[decoded.userType]
      .findById(decoded._id)
      .select('-password -refreshToken');

    if (!user) throw new ApiError({401, 'Invalid token'});
    
    req.user = { ...user.toObject(), userType: decoded.userType };
    next();
  } catch (error) {
    throw new ApiError({401, error instanceof Error ? error.message : 'Invalid token'});
  }
};