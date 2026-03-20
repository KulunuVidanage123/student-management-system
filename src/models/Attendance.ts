// src/models/Attendance.ts
import { Schema, model, models } from 'mongoose';

const AttendanceSchema = new Schema({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  studentName: { type: String, required: true },
  date: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'excused'],
    required: true 
  },
  month: { 
    type: String, 
    required: true 
  }, // Format: "YYYY-MM"
  year: { 
    type: Number, 
    required: true 
  },
}, { timestamps: true });

AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

const Attendance = models.Attendance || model('Attendance', AttendanceSchema);

export default Attendance;