import { Router } from 'express';
import {
  registerParent,
  loginParent,
  logoutParent,
  registerChild,
  getParentChildren,
  updateChild,
  deleteChild
} from './parentController';
import { verifyJWT, verifyParentJWT } from '../middlewares/authMiddleWare';
import { parentRegisterValidator, childRegisterValidator } from '../middlewares/validators';

const parentRouter = Router();


parentRouter.post('/register', parentRegisterValidator, registerParent);
parentRouter.post('/login', loginParent);
parentRouter.post('/logout', verifyJWT, verifyParentJWT, logoutParent);

parentRouter.post('/children', verifyJWT, verifyParentJWT, childRegisterValidator, registerChild);
parentRouter.get('/children', verifyJWT, verifyParentJWT, getParentChildren);
parentRouter.put('/children/:childId', verifyJWT, verifyParentJWT, updateChild);
parentRouter.delete('/children/:childId', verifyJWT, verifyParentJWT, deleteChild);

export default parentRouter;
