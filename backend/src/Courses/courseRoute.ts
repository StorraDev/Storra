import { Router } from 'express';
import { upload } from '../middlewares/multerUpload';
import { createCourse, getCourses, getCourseById } from './courseController';
import { verifyJWT } from '../middlewares/authMiddleWare';

const router = Router();

router.post('/', 
  verifyJWT, 
  upload.array('materials', 10), // Accept up to 10 files
  createCourse
);

// Get all courses
router.get('/', getCourses);

// Get course by ID
router.get('/:id', getCourseById);

export default router;