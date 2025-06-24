// import { Admin } from '../Admin/adminModel';
// import { ApiError } from '../utils/ApiError';
// import { asyncHandler } from '../utils/AsyncHandler';
// import jwt from 'jsonwebtoken';
// import type { RequestHandler } from 'express';
// import { logger } from '../utils/logger';

// // Extend Express Request interface for admin
// declare global {
//   namespace Express {
//     interface Request {
//       admin?: {
//         id: string;
//         adminLevel: string;
//         countryId?: string;
//         permissions: string[];
//         email: string;
//         firstName: string;
//         lastName: string;
//       };
//     }
//   }
// }

// // Interface for JWT payload
// interface AdminJWTPayload extends jwt.JwtPayload {
//   id: string;
//   adminLevel: string;
//   countryId?: string;
// }

// export const verifyAdminJWT: RequestHandler = asyncHandler(async (req, res, next) => {
//   try {
//     // Extract token from cookies or Authorization header
//     const token = req.cookies?.adminAccessToken || req.header('Authorization')?.replace('Bearer ', '');
    
//     logger.info('🔍 Admin token received:', { status: token ? 'Present' : 'Missing' });
        
//     if (!token) {
//       throw new ApiError({
//         statusCode: 401,
//         message: 'Admin access token is required'
//       });
//     }

//     // Verify and decode the token
//     const decoded = jwt.verify(
//       token, 
//       process.env.ADMIN_ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET!
//     ) as AdminJWTPayload;

//     console.log('🔍 Decoded admin token:', {
//       adminId: decoded.id,
//       adminLevel: decoded.adminLevel
//     });

//     // Find the admin in the database
//     const admin = await Admin
//       .findById(decoded.id)
//       .select('-password -refreshToken')
//       .populate('countryId', 'name code'); // Populate country info if needed

//     if (!admin) {
//       throw new ApiError({
//         statusCode: 401,
//         message: 'Admin not found or token is invalid'
//       });
//     }

//     // Check if admin is active
//     if (!admin.isActive) {
//       throw new ApiError({
//         statusCode: 401,
//         message: 'Admin account is deactivated'
//       });
//     }

//     // Attach admin to request object
//     req.admin = {
//       id: admin._id.toString(),
//       adminLevel: admin.adminLevel,
//       countryId: admin.countryId?.toString(),
//       permissions: admin.permissions || [],
//       email: admin.email,
//       firstName: admin.firstName,
//       lastName: admin.lastName
//     };

//     console.log('✅ Admin authenticated:', {
//       adminId: req.admin.id,
//       adminLevel: req.admin.adminLevel
//     });

//     next();
    
//   } catch (error) {
//     console.error('❌ Admin JWT Verification failed:', error);
        
//     // Handle specific JWT errors
//     if (error instanceof jwt.JsonWebTokenError) {
//       throw new ApiError({
//         statusCode: 401,
//         message: 'Invalid admin access token'
//       });
//     } else if (error instanceof jwt.TokenExpiredError) {
//       throw new ApiError({
//         statusCode: 401,
//         message: 'Admin access token has expired'
//       });
//     } else if (error instanceof ApiError) {
//       throw error;
//     } else {
//       throw new ApiError({
//         statusCode: 401,
//         message: 'Admin authentication failed'
//       });
//     }
//   }
// });

// // Middleware to verify admin level permissions
// export const verifyAdminLevel = (requiredLevel: string | string[]) => {
//   return asyncHandler(async (req, res, next) => {
//     if (!req.admin) {
//       throw new ApiError({
//         statusCode: 401,
//         message: 'Admin authentication required'
//       });
//     }

//     const allowedLevels = Array.isArray(requiredLevel) ? requiredLevel : [requiredLevel];
    
//     if (!allowedLevels.includes(req.admin.adminLevel)) {
//       throw new ApiError({
//         statusCode: 403,
//         message: `Access restricted. Required admin level: ${allowedLevels.join(' or ')}`
//       });
//     }

//     next();
//   });
// };

// // Middleware to verify admin permissions
// export const verifyAdminPermission = (requiredPermission: string | string[]) => {
//   return asyncHandler(async (req, res, next) => {
//     if (!req.admin) {
//       throw new ApiError({
//         statusCode: 401,
//         message: 'Admin authentication required'
//       });
//     }

//     const requiredPermissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    
//     const hasPermission = requiredPermissions.some(permission => 
//       req.admin!.permissions.includes(permission)
//     );

//     if (!hasPermission) {
//       throw new ApiError({
//         statusCode: 403,
//         message: `Access denied. Required permission: ${requiredPermissions.join(' or ')}`
//       });
//     }

//     next();
//   });
// };

// // Middleware to verify super admin access
// export const verifySuperAdmin: RequestHandler = asyncHandler(async (req, res, next) => {
//   if (!req.admin) {
//     throw new ApiError({
//       statusCode: 401,
//       message: 'Admin authentication required'
//     });
//   }

//   if (req.admin.adminLevel !== 'super_admin') {
//     throw new ApiError({
//       statusCode: 403,
//       message: 'Access restricted to super admins only'
//     });
//   }

//   next();
// });

// // Middleware to verify country admin access (for country-specific operations)
// export const verifyCountryAdmin: RequestHandler = asyncHandler(async (req, res, next) => {
//   if (!req.admin) {
//     throw new ApiError({
//       statusCode: 401,
//       message: 'Admin authentication required'
//     });
//   }

//   // Super admins can access any country
//   if (req.admin.adminLevel === 'super_admin') {
//     return next();
//   }

//   // Country admins can only access their own country
//   if (req.admin.adminLevel === 'country_admin' && req.admin.countryId) {
//     return next();
//   }

//   throw new ApiError({
//     statusCode: 403,
//     message: 'Access restricted to country admins or super admins'
//   });
// });