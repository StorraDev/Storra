import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Register Validator
const userRegisterValidator = async (req: Request, res: Response, next: NextFunction) => {
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