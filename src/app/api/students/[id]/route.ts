import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import mongoose from 'mongoose';

async function getValidId(paramsPromise: Promise<{ id: string }>) {
  const { id } = await paramsPromise;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return id;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await getValidId(params);
  if (!id) {
    return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
  }

  await dbConnect();
  try {
    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json(student, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await getValidId(params);
  if (!id) {
    return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
  }

  await dbConnect();
  try {
    const body = await request.json();
    const { name, email, dateOfBirth, mobileNumber, address, courseModule } = body;

    // Validate NEW required fields
    if (
      !name ||
      !email ||
      !dateOfBirth ||
      !mobileNumber ||
      !address ||
      !courseModule
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, email, date of birth, mobile number, address, or course module',
        },
        { status: 400 }
      );
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { name, email, dateOfBirth, mobileNumber, address, courseModule },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(updatedStudent, { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A student with this email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update student' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await getValidId(params);
  if (!id) {
    return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
  }

  await dbConnect();
  try {
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}