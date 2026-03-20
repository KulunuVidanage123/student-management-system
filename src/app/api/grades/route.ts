import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Grade from '@/models/Grade';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const session = await getSession();
    
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔐 Session:', { 
      id: session.id, 
      role: session.role,
      idType: typeof session.id 
    });

    // ✅ ALL users (admin and students) can see ALL grades
    const query = {};
    
    console.log('📊 Fetching all grades for user:', session.role);

    const grades = await Grade.find(query).sort({ gradedAt: -1 });
    
    console.log(`✅ Found ${grades.length} grades`);
    if (grades.length > 0) {
      console.log('📊 Sample grade:', grades[0]);
    }
    
    return NextResponse.json(grades);
  } catch (error: any) {
    console.error('❌ API - Error fetching grades:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    // 🔒 Only admins can CREATE grades
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    
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

    console.log('✅ Created grade:', newGrade);
    return NextResponse.json(newGrade, { status: 201 });
  } catch (error: any) {
    console.error('API - Error creating grade:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    
    // 🔒 Only admins can DELETE grades
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('id');
    
    if (!gradeId) {
      return NextResponse.json({ error: 'Grade ID is required' }, { status: 400 });
    }

    const deletedGrade = await Grade.findByIdAndDelete(gradeId);
    
    if (!deletedGrade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }
    
    console.log(`✅ Grade deleted: ${gradeId} by admin ${session.id}`);
    return NextResponse.json({ 
      message: 'Grade deleted successfully',
      deletedId: gradeId 
    }, { status: 200 });
  } catch (error: any) {
    console.error('API - Error deleting grade:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}