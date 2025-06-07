import { Router } from 'express'
import { registerCountry } from './countryController'
import {countryRegisterValidator} from '../middlewares/validators'
import { verifyJWT, verifyCountryJWT } from '../middlewares/authMiddleWare'

const countryRouter = Router()

countryRouter.route("/registercountry").post(
  verifyCountryJWT,   
  countryRegisterValidator,
  registerCountry)

export default countryRouter