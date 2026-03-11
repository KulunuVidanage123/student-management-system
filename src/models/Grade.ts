// src/models/Grade.ts
import { Schema, model, models } from 'mongoose';

const GradeSchema = new Schema({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  studentName: { type: String, required: true }, 
  assessmentId: { type: String, required: true },
  assessmentTitle: { type: String, required: true },
  assessmentType: { type: String, enum: ['Quiz', 'Assignment', 'Exam'], required: true },
  maxScore: { type: Number, required: true },
  score: { type: Number, required: true },
  gradedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Grade = models.Grade || model('Grade', GradeSchema);

export default Grade;