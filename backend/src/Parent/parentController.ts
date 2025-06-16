// Parent/parentController.ts
import { Request, Response } from 'express';
import { Parent } from './parentModel'
import { 
    registerParentService, 
    registerChildService, 
    getParentChildrenService, 
    updateChildService, 
    deleteChildService 
} from './parentService';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { generateAccessAndRefreshToken } from '../utils/generateTokens';
import { logger } from '../utils/logger';

// Register Parent Controller
const registerParent = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, phoneNumber, countryName, level } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !countryName) {
        throw new ApiError({
            statusCode: 400,
            message: 'All required fields must be provided'
        });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError({
            statusCode: 400,
            message: 'Please provide a valid email address'
        });
    }

    // Password validation
    if (password.length < 6) {
        throw new ApiError({
            statusCode: 400,
            message: 'Password must be at least 6 characters long'
        });
    }

    try {
        const result = await registerParentService({
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            countryName
        });

        // Generate tokens for parent
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
            (result.parent._id as string).toString(),
            'parent'
        );

        // Set cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };

        res.cookie('accessToken', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, cookieOptions);

        logger.info(`✅ Parent registration successful: ${result.parent.email}`);

        return res.status(201).json(
            new ApiResponse(
                201,
                'Parent registered successfully',
                {
                    parent: result.parent,
                    countryName: result.countryName,
                    accessToken,
                    refreshToken
                }
            )
        );

    } catch (error) {
        logger.error('❌ Parent registration failed:', {
            error: (error as Error).message,
            email
        });

        throw new ApiError({
            statusCode: 400,
            message: (error as Error).message || 'Parent registration failed'
        });
    }
});

const registerChild = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, dateOfBirth, gender, level, countryName } = req.body;

    // Validation
    if (!firstName || !lastName || !dateOfBirth || !gender || !level || !countryName) {
        throw new ApiError({
            statusCode: 400,
            message: 'All required fields must be provided'
        });
    }

    if (!req.user || req.user.userType !== 'parent') {
        throw new ApiError({
            statusCode: 401,
            message: 'Parent authentication required'
        });
    }

    try {
        const result = await registerChildService(req.user._id, {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            level,
            countryName,
        });

        logger.info(`✅ Child registration successful: ${result.child?.firstName} under parent ${req.user._id}`);

        return res.status(201).json(
            new ApiResponse( 201, 'Child registered successfully', result)
        );

    } catch (error) {
        logger.error('❌ Child registration failed:', {
            error: (error as Error).message,
            parentId: req.user._id,
            firstName
        });

        throw new ApiError({
            statusCode: 400,
            message: (error as Error).message || 'Child registration failed'
        });
    }
});

// Get Parent's Children Controller
const getParentChildren = asyncHandler(async (req: Request, res: Response) => {
    // Check if user is authenticated and is a parent
    if (!req.user || req.user.userType !== 'parent') {
        throw new ApiError({
            statusCode: 401,
            message: 'Parent authentication required'
        });
    }

    try {
        const data = await getParentChildrenService(req.user._id);

        return res.status(200).json(
            new ApiResponse(200,'Children retrieved successfully', data)
        );

    } catch (error) {
        logger.error('❌ Failed to get children:', {
            error: (error as Error).message,
            parentId: req.user._id
        });

        throw new ApiError({
            statusCode: 400,
            message: (error as Error).message || 'Failed to get children'
        });
    }
});

// Update Child Controller
const updateChild = asyncHandler(async (req: Request, res: Response) => {
    const { childId } = req.params;
    const updateData = req.body;

    // Check if user is authenticated and is a parent
    if (!req.user || req.user.userType !== 'parent') {
        throw new ApiError({
            statusCode: 401,
            message: 'Parent authentication required'
        });
    }

    if (!childId) {
        throw new ApiError({
            statusCode: 400,
            message: 'Child ID is required'
        });
    }

    try {
        const result = await updateChildService(req.user._id, childId, updateData);

        logger.info(`✅ Child updated successfully: ${childId} by parent ${req.user._id}`);

        return res.status(200).json(
            new ApiResponse( 200,'Child updated successfully', result)
        );

    } catch (error) {
        logger.error('❌ Failed to update child:', {
            error: (error as Error).message,
            parentId: req.user._id,
            childId
        });

        throw new ApiError({
            statusCode: 400,
            message: (error as Error).message || 'Failed to update child'
        });
    }
});

// Delete Child Controller
const deleteChild = asyncHandler(async (req: Request, res: Response) => {
    const { childId } = req.params;

    // Check if user is authenticated and is a parent
    if (!req.user || req.user.userType !== 'parent') {
        throw new ApiError({
            statusCode: 401,
            message: 'Parent authentication required'
        });
    }

    if (!childId) {
        throw new ApiError({
            statusCode: 400,
            message: 'Child ID is required'
        });
    }

    try {
        const result = await deleteChildService(req.user._id, childId);

        logger.info(`✅ Child deleted successfully: ${childId} by parent ${req.user._id}`);

        return res.status(200).json(
            new ApiResponse(200,'Child deleted successfully', result)
        );

    } catch (error) {
        logger.error('❌ Failed to delete child:', {
            error: (error as Error).message,
            parentId: req.user._id,
            childId
        });

        throw new ApiError({
            statusCode: 400,
            message: (error as Error).message || 'Failed to delete child'
        });
    }
});

// Login Parent Controller
const loginParent = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError({
            statusCode: 400,
            message: 'Email and password are required'
        });
    }

    try {
       
        const parent = await Parent.findOne({ email: email.toLowerCase() })
            .populate('countryId')
            .select('+password');

        if (!parent) {
            throw new ApiError({
                statusCode: 401,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await parent.comparePassword(password);
        if (!isPasswordValid) {
            throw new ApiError({
                statusCode: 401,
                message: 'Invalid email or password'
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
            (parent._id as string).toString(),
            'parent'
        );

        // Set cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };

        res.cookie('accessToken', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, cookieOptions);

        // Remove sensitive data
        const parentData = parent.toObject();
        delete (parentData as any).password;
        delete (parentData as any).refreshToken;

        logger.info(`✅ Parent login successful: ${parent.email}`);

        return res.status(200).json(
            new ApiResponse(200,'Parent logged in successfully',
                {
                    parent: parentData,
                    accessToken,
                    refreshToken
                }
            )
        );

    } catch (error) {
        logger.error('❌ Parent login failed:', {
            error: (error as Error).message,
            email
        });

        throw new ApiError({
            statusCode: 401,
            message: (error as Error).message || 'Login failed'
        });
    }
});


const logoutParent = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || req.user.userType !== 'parent') {
        throw new ApiError({
            statusCode: 401,
            message: 'Parent authentication required'
        });
    }

    try {
        const { Parent } = require('./parentModel');
        
        // Clear refresh token from database
        await Parent.findByIdAndUpdate(
            req.user._id,
            { $unset: { refreshToken: 1 } },
            { new: true }
        );
    
        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        logger.info(`✅ Parent logout successful: ${req.user.email}`);

        return res.status(200).json(
            new ApiResponse(200, 'Parent logged out successfully', {})
        );
    } catch (error) {
        logger.error('❌ Parent logout failed:', {
            error: (error as Error).message,
            parentId: req.user._id
        });

        throw new ApiError({
            statusCode: 500,
            message: (error as Error).message || 'Logout failed'
        });
    }
});

export {
    registerChild,
    registerParent,
    getParentChildren,
    updateChild,
    deleteChild,
    loginParent,
    logoutParent
}