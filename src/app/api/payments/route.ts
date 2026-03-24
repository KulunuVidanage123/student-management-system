// src/app/api/payments/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');

    let query: any = {};
    
    // Students can only see their own payments
    if (session.role !== 'admin') {
      query.studentId = session.id;
    }
    
    // Apply filters
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;

    const payments = await Payment.find(query)
      .sort({ dueDate: 1 })
      .populate('studentId', 'name email');
    
    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('API - Error fetching payments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getSession();
    
    // Only admins can create payments
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, studentName, studentEmail, feeType, amount, dueDate, academicYear, semester, notes } = body;

    if (!studentId || !feeType || !amount || !dueDate || !academicYear) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payment = await Payment.create({
      studentId,
      studentName,
      studentEmail,
      feeType,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate),
      academicYear,
      semester,
      notes,
      status: 'pending',
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('API - Error creating payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, paymentMethod, transactionId, paidDate, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (transactionId) updateData.transactionId = transactionId;
    if (paidDate) updateData.paidDate = new Date(paidDate);
    if (notes !== undefined) updateData.notes = notes;

    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPayment);
  } catch (error: any) {
    console.error('API - Error updating payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const deletedPayment = await Payment.findByIdAndDelete(id);
    
    if (!deletedPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error: any) {
    console.error('API - Error deleting payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}