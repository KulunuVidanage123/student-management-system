// src/app/api/attendance/bulk/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { attendances } = body; 
    
    if (!Array.isArray(attendances) || attendances.length === 0) {
      return NextResponse.json({ error: 'Invalid attendance data' }, { status: 400 });
    }
    
    const results = [];
    
    for (const attendanceData of attendances) {
      const { studentId, studentName, date, status, month, year } = attendanceData;
      
      const existingAttendance = await Attendance.findOne({ 
        studentId, 
        date: new Date(date) 
      });
      
      if (existingAttendance) {
        // Update existing record
        existingAttendance.status = status;
        await existingAttendance.save();
        results.push(existingAttendance);
      } else {
        // Create new record
        const attendance = await Attendance.create({
          studentId,
          studentName,
          date: new Date(date),
          status,
          month,
          year: parseInt(year),
        });
        results.push(attendance);
      }
    }
    
    return NextResponse.json({ 
      message: 'Attendance marked successfully',
      count: results.length 
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}