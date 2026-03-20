// src/app/api/attendance/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { getSession } from '@/lib/auth'; // Import your auth helper

export async function GET(request: Request) {
  // Anyone logged in can VIEW attendance
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    let query: any = {};
    if (month && year) {
      query.month = `${year}-${month}`;
      query.year = parseInt(year);
    }
    
    const attendance = await Attendance.find(query).sort({ date: 1 });
    return NextResponse.json(attendance);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // 🔒 ONLY ADMINS can CREATE/UPDATE attendance
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { studentId, studentName, date, status, month, year } = body;
    
    if (!studentId || !date || !status || !month || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const existingAttendance = await Attendance.findOne({ studentId, date: new Date(date) });
    
    if (existingAttendance) {
      existingAttendance.status = status;
      await existingAttendance.save();
      return NextResponse.json(existingAttendance, { status: 200 });
    }
    
    const attendance = await Attendance.create({
      studentId,
      studentName,
      date: new Date(date),
      status,
      month,
      year: parseInt(year),
    });
    
    return NextResponse.json(attendance, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}