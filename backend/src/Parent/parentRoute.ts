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


parentRouter.post('/registerparent', parentRegisterValidator, registerParent);
parentRouter.post('/loginparent', loginParent);
parentRouter.post('/logoutparent', verifyJWT, verifyParentJWT, logoutParent);

parentRouter.post('/registerchild', verifyJWT, verifyParentJWT, childRegisterValidator, registerChild);
parentRouter.get('/parentchildren', verifyJWT, verifyParentJWT, getParentChildren);
parentRouter.put('/updatechildren/:childId', verifyJWT, verifyParentJWT, updateChild);
parentRouter.delete('/deletechildren/:childId', verifyJWT, verifyParentJWT, deleteChild);

export default parentRouter;
