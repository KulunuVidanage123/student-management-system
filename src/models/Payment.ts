// src/models/Payment.ts
import { Schema, model, models } from 'mongoose';

const PaymentSchema = new Schema({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  
  // Fee Details
  feeType: { 
    type: String, 
    enum: ['Tuition', 'Registration', 'Exam', 'Library', 'Lab', 'Transport', 'Other'],
    required: true 
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  
  // Payment Details
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'overdue', 'partial', 'refunded'],
    default: 'pending'
  },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'bank_transfer', 'online', 'scholarship'],
  },
  transactionId: { type: String },
  
  // Dates
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  
  // Metadata
  academicYear: { type: String, required: true }, // e.g., "2024-2025"
  semester: { type: String, enum: ['Fall', 'Spring', 'Summer'] },
  notes: { type: String },
}, { timestamps: true });

// Indexes for efficient queries
PaymentSchema.index({ studentId: 1, academicYear: 1 });
PaymentSchema.index({ status: 1, dueDate: 1 });

const Payment = models.Payment || model('Payment', PaymentSchema);

export default Payment;