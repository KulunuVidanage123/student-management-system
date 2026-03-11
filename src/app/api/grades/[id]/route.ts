// src/app/api/grades/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Grade from '@/models/Grade';
import mongoose from 'mongoose';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid grade ID' }, { status: 400 });
    }

    await dbConnect();
    
    const deletedGrade = await Grade.findByIdAndDelete(id);
    
    if (!deletedGrade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Grade deleted successfully',
      deletedId: id 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting grade:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}