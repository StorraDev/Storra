import { Router } from 'express';
import { registerStudent, loginStudent, logoutStudent, refreshAccessToken, updatePassword, updateStudentProfile, getStudentProfile, checkStudentInfo } from './studentController';
import { schoolRegisterValidator } from '../middlewares/validators';
import { verifyStudentJWT, verifyJWT } from '../middlewares/authMiddleWare';

const schoolRouter = Router();

// Register school route

schoolRouter.post('/registerschool', schoolRegisterValidator, registerStudent);
schoolRouter.post('/loginschool', loginStudent);
schoolRouter.post('/logoutschool', verifyJWT, verifyStudentJWT, logoutStudent);
schoolRouter.post('/refreshaccesstoken', verifyJWT, verifyStudentJWT, refreshAccessToken);
schoolRouter.put('/updatepassword', verifyJWT, verifyStudentJWT, updatePassword);
schoolRouter.put('/updateschoolprofile', verifyJWT, verifyStudentJWT, updateStudentProfile);
schoolRouter.get('/profile', verifyJWT, verifyStudentJWT, getStudentProfile);
schoolRouter.get('/info/:name', verifyJWT, verifyStudentJWT, checkStudentInfo);


export default schoolRouter;