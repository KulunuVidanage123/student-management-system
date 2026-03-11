import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Grade from '@/models/Grade';

export async function GET() {
  try {
    await dbConnect();
    const grades = await Grade.find({}).sort({ gradedAt: -1 });
    console.log('API - Fetched grades:', grades);
    return NextResponse.json(grades);
  } catch (error: any) {
    console.error('API - Error fetching grades:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    console.log('API - Received grade data:', body);
    
    const { studentId, studentName, assessmentId, assessmentTitle, assessmentType, maxScore, score } = body;

    if (!studentId || !assessmentId || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newGrade = await Grade.create({
      studentId,
      studentName,
      assessmentId,
      assessmentTitle,
      assessmentType,
      maxScore,
      score,
    });

    console.log('API - Created grade:', newGrade);
    return NextResponse.json(newGrade, { status: 201 });
  } catch (error: any) {
    console.error('API - Error creating grade:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}