import { Router } from 'express'
import { registerCountry, loginCountry, logoutCountry, refreshAccessToken, checkCountryInfo } from './countryController'
import {countryRegisterValidator} from '../middlewares/validators'
import { verifyJWT, verifyCountryJWT } from '../middlewares/authMiddleWare'

const countryRouter = Router()

countryRouter.route("/registercountry").post(   
  countryRegisterValidator,
  registerCountry
)

countryRouter.route("/logincountry").post(
  loginCountry
)

countryRouter.route("/logoutcountry").post(
  verifyJWT,
  verifyCountryJWT,
  logoutCountry
)

countryRouter.route("/refreshtoken").post(
  verifyJWT,
  verifyCountryJWT,
  refreshAccessToken
)

countryRouter.route("/info/:name").get(
  verifyJWT,
  verifyCountryJWT,
  checkCountryInfo
)

export default countryRouter