import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Register Validator
const countryRegisterValidator = async (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (err: any) {
    res.status(400).json({ error: err.details.map((e: any) => e.message) });
  }
};

const schoolRegisterValidator = async (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    countryId: Joi.string().required(),
    address: Joi.string().max(500).required(),
    phone: Joi.string().pattern(/^[0-9\s\-\+]+$/).required(),
    schoolLevels: Joi.array().items(Joi.string()).min(1).required(),
    subscriptionType: Joi.string().valid('basic', 'premium', 'enterprise').default('basic')
  });
  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (err: any) {
    res.status(400).json({ error: err.details.map((e: any) => e.message) });
  }
}
export { countryRegisterValidator, schoolRegisterValidator };