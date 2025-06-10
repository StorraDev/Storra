import { Router } from 'express';
import { registerSchool } from './schoolController';
import { schoolRegisterValidator } from '../middlewares/validators';

const schoolRouter = Router();

// Register school route

schoolRouter.post('/registerschool', schoolRegisterValidator, registerSchool);

export default schoolRouter;