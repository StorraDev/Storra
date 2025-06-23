import mongoose, { Schema, Document, model } from 'mongoose';
import { ICourseDocument } from '../types/courseTypes'
const courseSchema = new Schema<ICourseDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    level: { type: String, enum: ['primary', 'secondary', 'tertiary'], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    materials: [
      {
        type: {
          type: String,
          enum: ['video', 'pdf'],
          required: true
        },
        title: { type: String, required: true },
        s3Url: { type: String, required: true }
      }
    ]
  },
  { timestamps: true }
);

export const Course = mongoose.model<ICourseDocument>('Course', courseSchema);