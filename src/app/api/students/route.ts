import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';

export async function GET() {
  try {
    await dbConnect();

    const students = await Student.find({}).select('-__v');

    return NextResponse.json(students, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/students error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

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

    // Create new student with NEW fields
    const newStudent = new Student({
      name,
      email,
      dateOfBirth,
      mobileNumber,
      address,
      courseModule,
    });
    await newStudent.save();

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/students error:', error);

    // Handle duplicate email
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A student with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create student' },
      { status: 400 }
    );
  }
}