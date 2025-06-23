// interfaces/ICourse.ts

import { Document, Types } from 'mongoose';

export interface ICourseMaterial {
  type: 'video' | 'pdf';
  title: string;
  s3Url: string;
}

export interface ICourse {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  level: 'primary' | 'secondary' | 'tertiary';
  createdBy: Types.ObjectId;
  materials: ICourseMaterial[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICourseDocument extends Omit<ICourse, '_id'>, Document {}
