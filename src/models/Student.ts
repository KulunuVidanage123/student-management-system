import { Schema, model, models } from 'mongoose';

// Define course options (must match frontend)
const COURSE_OPTIONS = [
  'Computer Science',
  'Software Engineering',
  'Web Development',
  'Mobile App Development',
  'Machine Learning',
  'Networking & Security',
  'Blockchain Technology',
  'Robotics & Automation',
] as const;

const StudentSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  dateOfBirth: { 
    type: Date, 
    required: true 
  },
  mobileNumber: { 
    type: String, 
    required: true,
    trim: true
  },
  address: { 
    type: String, 
    required: true,
    trim: true
  },
  courseModule: { 
    type: String, 
    required: true,
    enum: {
      values: COURSE_OPTIONS,
      message: 'Invalid course module. Please select a valid option.'
    }
  },
}, {
  timestamps: true,
});

const Student = models.Student || model('Student', StudentSchema);

export default Student;