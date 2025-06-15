import { Router } from 'express';
import { registerIndividual, loginIndividual, logoutIndividual, refreshAccessToken, updatePassword, updateIndividualProfile, getIndividualProfile, checkIndividualInfo } from './individualController';
import { individualRegisterValidator } from '../middlewares/validators';
import { verifyIndividualJWT, verifyJWT } from '../middlewares/authMiddleWare';

const individualRouter = Router();

// Register individual route

individualRouter.post('/registerindividual', individualRegisterValidator, registerIndividual);
individualRouter.post('/loginindividual', loginIndividual);
individualRouter.post('/logoutindividual', verifyJWT, verifyIndividualJWT, logoutIndividual);
individualRouter.post('/refreshaccesstoken', verifyJWT, verifyIndividualJWT, refreshAccessToken);
individualRouter.put('/updatepassword', verifyJWT, verifyIndividualJWT, updatePassword);
individualRouter.put('/updateindividualprofile', verifyJWT, verifyIndividualJWT, updateIndividualProfile);
individualRouter.get('/profile', verifyJWT, verifyIndividualJWT, getIndividualProfile);
individualRouter.get('/info/:name', verifyJWT, verifyIndividualJWT, checkIndividualInfo);


export default individualRouter;