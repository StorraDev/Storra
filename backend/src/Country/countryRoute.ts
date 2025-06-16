import { Router } from 'express'
import { registerCountry, loginCountry, logoutCountry, refreshAccessToken, checkCountryInfo, updateCountryProfile, updatePassword, getCountryProfile, getAllCountries, deleteCountry} from './countryController'
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

countryRouter.route("/updateprofile").put(
  verifyJWT,
  verifyCountryJWT,
  updateCountryProfile
)

countryRouter.route("/updatepassword").put(
  verifyJWT,
  verifyCountryJWT,
  updatePassword
)

countryRouter.route("/profile").get(
  verifyJWT,
  verifyCountryJWT,
  getCountryProfile
)

countryRouter.route("/all").get(
  verifyJWT,
  verifyCountryJWT,
  getAllCountries
)

countryRouter.route("/delete").delete(
  verifyJWT,
  verifyCountryJWT,
  deleteCountry
)

export default countryRouter