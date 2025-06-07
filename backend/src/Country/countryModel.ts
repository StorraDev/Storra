import mongoose, { Schema, Document } from 'mongoose'
import { ICountryDocument } from '../types/countryTypes'
import validator from 'validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import ms from 'ms'

declare global {
    namespace NodeJS {
      interface ProcessEnv {
        ACCESS_TOKEN_SECRET: string;
        REFRESH_TOKEN_SECRET: string;
        ACCESS_TOKEN_EXPIRY: string;
        REFRESH_TOKEN_EXPIRY: string;
      }
    }
}

interface ICountryMethods {
    comparePassword(enteredPassword: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

interface ICountryDocuments extends ICountryDocument, ICountryMethods, Document{}

interface CountryModel extends mongoose.Model<ICountryDocuments> {}


const CountrySchema = new Schema<ICountryDocuments, CountryModel, ICountryMethods>({
    name: {type: String, required: true, unique: true, trim: true, index: true},
    email: { type: String, required: true, unique: true, validate: { validator: (email: string) => validator.isEmail(email), message: 'Please provide a valid email address'} },
    password: { type: String, required: [true, 'password is required'] },
    countryCode: { type: String, required: true, uppercase: true },
    registrationNumber: { type: String, required: true, unique: true },
    isVerified: {
        type: Boolean,
        default: false
    },
    userType: {
        type: String,
        enum: ['country', 'school', 'student', 'school'],
        default: 'country'
    }
},{ timestamps: true }
)

CountrySchema.methods.comparePassword = async function(enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

CountrySchema.methods.generateAccessToken = function () {
  const payload = {
    _id: this._id,
    name: this.name,
    email: this.email,
  };

  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET is not configured');
  }

  const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
  if (!accessTokenExpiry || !isValidExpiry(accessTokenExpiry)) {
    throw new Error('Invalid ACCESS_TOKEN_EXPIRY format. Use like "15m" or "1h"');
  }

  const opts = {expiresIn: accessTokenExpiry} as jwt.SignOptions //we add "as jwt.SignOptions" to make the jwt.sign method know that we passed an object and not a callback function.

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, opts);
  
};
  
CountrySchema.methods.generateRefreshToken = function () {
  const payload = { _id: this._id }; // Minimal payload for refresh token

  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET is not configured');
  }

  const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;
  if (!refreshTokenExpiry || !isValidExpiry(refreshTokenExpiry)) {
    throw new Error('Invalid REFRESH_TOKEN_EXPIRY format. Use like "7d" or "30d"');
  }
  
  const opts =   { expiresIn: refreshTokenExpiry } as jwt.SignOptions; //we add "as jwt.SignOptions" to make the jwt.sign method know that we passed an object and not a callback function.

  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET,
    opts
  );
};

  
  // Helper function to validate expiry format
  function isValidExpiry(expiry: any): boolean {
    // if it is a negative number return false.
    if(Number(expiry) < 0) return false;

    //check if expiry is a number written as a string.
    const regexIsNumber = /^\d+$/;

    //test for format like "10 days", "10d", "2 hrs", "4h".
    const regexAlphaNum = /^(\d{1,})+\s?[a-z]+$/;

    const isNumber = regexIsNumber.test(expiry);
    const isAlphaNum = regexAlphaNum.test(expiry);

    if (isNumber) return true; // Accept plain numbers (seconds)
    else{
      //if expiry contains a number and a letter.
      if(isAlphaNum){
        try {
          const milliseconds = ms(expiry);
          return milliseconds != undefined ? true : false; // Validate string formats like "15m"
        } catch {
          //if an error is thrown return false;
          return false;
        }
      }else return false;
    }
         
  }

export const Country = mongoose.model('Country', CountrySchema, 'countries')