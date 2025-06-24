import { Request, Response } from 'express';
import { AdminService } from './adminService';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/AsyncHandler';
import { logger } from '../utils/logger';



export class AdminController {

  static createAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, adminLevel, countryId } = req.body;

    if (!firstName || !lastName || !email || !password || !adminLevel) {
      throw new ApiError({
        statusCode: 400,
        message: 'All fields are required'
      });
    }

    if (!req.user?.id) {
      throw new ApiError({
        statusCode: 401,
        message: 'Admin authentication required'
      });
    }

    try {
      const result = await AdminService.createAdmin(
        { firstName, lastName, email, password, adminLevel, countryId },
        req.user.id
      );

      logger.info(`✅ Admin created by ${req.user.id}: ${email}`);

      return res.status(201).json(
        new ApiResponse(201, 'Admin created successfully', {
          admin: result.admin,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        })
      );
    } catch (error) {
      logger.error('❌ Failed to create admin:', {
        error: (error as Error).message,
        adminId: req.user?.id,
        email
      });

      throw new ApiError({
        statusCode: 400,
        message: (error as Error).message
      });
    }
  });
  static createInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { email, adminLevel, countryId } = req.body;

    if (!email || !adminLevel) {
      throw new ApiError({
        statusCode: 400,
        message: 'Email and admin level are required'
      });
    }

    if (!req.user?.id) {
      throw new ApiError({
        statusCode: 401,
        message: 'Admin authentication required'
      });
    }

    try {
      const result = await AdminService.createInvitation(
        { email, adminLevel, countryId },
        req.user.id
      );

      logger.info(`✅ Admin invitation created by ${req.user.id} for ${email}`);

      return res.status(201).json(
        new ApiResponse(201, 'Invitation created successfully', {
          invitationId: result.invitationId,
          email: result.email,
        })
      );
    } catch (error) {
      logger.error('❌ Failed to create admin invitation:', {
        error: (error as Error).message,
        adminId: req.user?.id,
        email
      });

      throw new ApiError({
        statusCode: 400,
        message: (error as Error).message
      });
    }
  });

  static acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { token, firstName, lastName, password, phone } = req.body;

    if (!token || !firstName || !lastName || !password) {
      throw new ApiError({
        statusCode: 400,
        message: 'Token, first name, last name, and password are required'
      });
    }

    try {
      const result = await AdminService.acceptInvitation({
        token,
        firstName,
        lastName,
        password,
        phone,
      });

      logger.info(`✅ Admin account created: ${result.admin.email}`);

      return res.status(201).json(
        new ApiResponse(201, 'Admin account created successfully', {
          admin: result.admin,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        })
      );
    } catch (error) {
      logger.error('❌ Failed to accept admin invitation:', {
        error: (error as Error).message,
        token
      });

      throw new ApiError({
        statusCode: 400,
        message: (error as Error).message
      });
    }
  });

  static loginAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError({
        statusCode: 400,
        message: 'Email and password are required'
      });
    }

    try {
      const result = await AdminService.loginAdmin({ email, password });

      logger.info(`✅ Admin login successful: ${email}`);

      return res.status(200).json(
        new ApiResponse(200, 'Login successful', {
          admin: result.admin,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        })
      );
    } catch (error) {
      logger.error('❌ Admin login failed:', {
        error: (error as Error).message,
        email
      });

      throw new ApiError({
        statusCode: 401,
        message: (error as Error).message
      });
    }
  });

  static getAllAdmins = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new ApiError({
        statusCode: 401,
        message: 'Admin authentication required'
      });
    }

    const { country } = req.query;

    try {
      const admins = await AdminService.getAllAdmins(
        req.user.id,
        country as string
      );

      logger.info(`✅ Admins list retrieved by ${req.user.id}`);

      return res.status(200).json(
        new ApiResponse(200, 'Admins retrieved successfully', {
          admins,
          count: admins.length,
        })
      );
    } catch (error) {
      logger.error('❌ Failed to retrieve admins:', {
        error: (error as Error).message,
        adminId: req.user.id
      });

      throw new ApiError({
        statusCode: 400,
        message: (error as Error).message
      });
    }
  });

  static updateAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { adminId } = req.params;
    const updateData = req.body;

    if (!req.user?.id) {
      throw new ApiError({
        statusCode: 401,
        message: 'Admin authentication required'
      });
    }

    try {
      const result = await AdminService.updateAdmin(
        adminId,
        updateData,
        req.user.id
      );

      logger.info(`✅ Admin updated: ${adminId} by ${req.user.id}`);

      return res.status(200).json(
        new ApiResponse(200, result.message, {
          admin: result.admin,
        })
      );
    } catch (error) {
      logger.error('❌ Failed to update admin:', {
        error: (error as Error).message,
        adminId,
        updater: req.user.id
      });

      throw new ApiError({
        statusCode: 400,
        message: (error as Error).message
      });
    }
  });

  static getPendingInvitations = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new ApiError({
        statusCode: 401,
        message: 'Admin authentication required'
      });
    }

    try {
      const invitations = await AdminService.getPendingInvitations(req.user.id);

      logger.info(`✅ Pending invitations retrieved by ${req.user.id}`);

      return res.status(200).json(
        new ApiResponse(200, 'Pending invitations retrieved successfully', {
          invitations,
          count: invitations.length,
        })
      );
    } catch (error) {
      logger.error('❌ Failed to retrieve pending invitations:', {
        error: (error as Error).message,
        adminId: req.user.id
      });

      throw new ApiError({
        statusCode: 400,
        message: (error as Error).message
      });
    }
  });
}