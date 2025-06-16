import { Router } from 'express';
import { registerSchool, loginSchool, logoutSchool, refreshAccessToken, updatePassword, updateSchoolProfile, deleteSchool, getAllStudents, getSchoolProfile, checkSchoolInfo } from './schoolController';
import { schoolRegisterValidator } from '../middlewares/validators';
import { verifySchoolJWT, verifyJWT } from '../middlewares/authMiddleWare';

const schoolRouter = Router();

// Register school route

schoolRouter.post('/registerschool', schoolRegisterValidator, registerSchool);
schoolRouter.post('/loginschool', loginSchool);
schoolRouter.post('/logoutschool', verifyJWT, verifySchoolJWT, logoutSchool);
schoolRouter.post('/refreshaccesstoken', verifyJWT, verifySchoolJWT, refreshAccessToken);
schoolRouter.put('/updatepassword', verifyJWT, verifySchoolJWT, updatePassword);
schoolRouter.put('/updateschoolprofile', verifyJWT, verifySchoolJWT, updateSchoolProfile);
schoolRouter.delete('/deleteschool', verifyJWT, verifySchoolJWT, deleteSchool);
schoolRouter.get('/all', verifyJWT, verifySchoolJWT, getAllStudents);
schoolRouter.get('/profile', verifyJWT, verifySchoolJWT, getSchoolProfile);
schoolRouter.get('/info/:name', verifyJWT, verifySchoolJWT, checkSchoolInfo);


export default schoolRouter;