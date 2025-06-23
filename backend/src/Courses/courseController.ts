import { Request, Response } from 'express';
import { asyncHandler } from '../utils/AsyncHandler';
import { Course } from './courseModel';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { uploadFileToS3 } from './courseService';
import { logger } from '../utils/logger';
import fs from 'fs';

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    [key: string]: any;
  };
}

export const createCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, level } = req.body;
    const files = req.files as Express.Multer.File[];

    // Validation
    if (!title || !description || !level) {
      throw new ApiError({ 
        statusCode: 400, 
        message: 'Title, description, and level are required' 
      });
    }

    if (!files || files.length === 0) {
      throw new ApiError({ 
        statusCode: 400, 
        message: 'At least one file is required' 
      });
    }

    if (!req.user?._id) {
      throw new ApiError({ 
        statusCode: 401, 
        message: 'User not authenticated' 
      });
    }

    // Upload files to S3 and create materials array
    const materials = await Promise.all(
      files.map(async (file) => {
        const s3Url = await uploadFileToS3(file);
        
        // Determine file type more accurately
        let fileType: 'video' | 'pdf';
        if (file.mimetype === 'application/pdf') {
          fileType = 'pdf';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        } else {
          throw new ApiError({ 
            statusCode: 400, 
            message: `Unsupported file type: ${file.mimetype}` 
          });
        }

        return {
          title: file.originalname.split('.')[0], // Remove extension
          type: fileType,
          s3Url
        };
      })
    );

    // Create course
    const course = await Course.create({
      title,
      description,
      level,
      createdBy: req.user._id,
      materials
    });

    logger.info(`Course created successfully: ${course._id}`);

    res.status(201).json(
      new ApiResponse(
        201, 
        'Course created successfully',
        course
      )
    );
  } catch (error) {
    logger.error('Error creating course:', error);
    
    // Clean up any uploaded files on error
    const files = req.files as Express.Multer.File[];
    if (files) {
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    throw error;
  }
});

export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const { level, page = 1, limit = 10 } = req.query;
  
  const filter: any = {};
  if (level) {
    filter.level = level;
  }

  const courses = await Course.find(filter)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

  const total = await Course.countDocuments(filter);

  res.json(
    new ApiResponse(
      200, 
      'Courses retrieved successfully',
      {
        courses,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    )
  );
});

export const getCourseById = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!course) {
    throw new ApiError({ 
      statusCode: 404, 
      message: 'Course not found' 
    });
  }

  res.json(
    new ApiResponse(
      200, 
      'Course retrieved successfully',
      course
    )
  );
});