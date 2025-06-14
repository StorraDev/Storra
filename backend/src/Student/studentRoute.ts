import { Router } from 'express';
import { registerStudent, loginStudent, logoutStudent, refreshAccessToken, updatePassword, updateStudentProfile, getStudentProfile, checkStudentInfo } from './studentController';
import { studentRegisterValidator } from '../middlewares/validators';
import { verifyStudentJWT, verifyJWT } from '../middlewares/authMiddleWare';

const studentRouter = Router();

// Register student route

studentRouter.post('/registerstudent', studentRegisterValidator, registerStudent);
studentRouter.post('/loginstudent', loginStudent);
studentRouter.post('/logoutstudent', verifyJWT, verifyStudentJWT, logoutStudent);
studentRouter.post('/refreshaccesstoken', verifyJWT, verifyStudentJWT, refreshAccessToken);
studentRouter.put('/updatepassword', verifyJWT, verifyStudentJWT, updatePassword);
studentRouter.put('/updatestudentprofile', verifyJWT, verifyStudentJWT, updateStudentProfile);
studentRouter.get('/profile', verifyJWT, verifyStudentJWT, getStudentProfile);
studentRouter.get('/info/:name', verifyJWT, verifyStudentJWT, checkStudentInfo);


export default studentRouter;