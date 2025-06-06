import mongoose, { Schema } from 'mongoose'
import { ICountryDocument} from '../types/countryTypes'
import validator from 'validator'


const countrySchema = new Schema<ICountryDocument>({
    name: {type: String, required: true, unique: true, trim: true, index: true},
    email: { type: String, required: true, unique: true, validate: { validator: (email: string) => validator.isEmail(email), message: 'Please provide a valid email address'} },
    password: { type: String, required: [true, 'password is required'] },
    countryCode: { type: String, required: true, uppercase: true },
    registrationNumber: { type: String, required: true, unique: true },
},{ timestamps: true }
)

export const Country = mongoose.model('Country', countrySchema)