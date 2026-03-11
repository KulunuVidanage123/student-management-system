// src/app/grades/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AssessmentType = 'Quiz' | 'Assignment' | 'Exam';

interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  maxScore: number;
  date: string;
  course: string;
}

interface GradeEntry {
  _id: string;
  studentId: string;
  studentName: string;
  assessmentId: string;
  assessmentTitle: string;
  assessmentType: AssessmentType;
  maxScore: number;
  score: number;
  gradedAt: string;
}

interface Student {
  _id: string;
  name: string;
}

// Static Assessments List
const ASSESSMENTS: Assessment[] = [
  { id: '1', title: 'Midterm Exam', type: 'Exam', maxScore: 100, date: '2023-10-15', course: 'Web Development' },
  { id: '2', title: 'React Quiz', type: 'Quiz', maxScore: 20, date: '2023-10-20', course: 'Web Development' },
  { id: '3', title: 'Database Project', type: 'Assignment', maxScore: 50, date: '2023-10-25', course: 'Database Systems' },
  { id: '4', title: 'Final Project', type: 'Exam', maxScore: 100, date: '2023-11-10', course: 'Mobile App Dev' },
  { id: '5', title: 'JavaScript Quiz', type: 'Quiz', maxScore: 20, date: '2023-11-15', course: 'Web Development' },
  { id: '6', title: 'Data Structures Assignment', type: 'Assignment', maxScore: 50, date: '2023-11-20', course: 'Data Structures' },
  { id: '7', title: 'UI/UX Design Quiz', type: 'Quiz', maxScore: 20, date: '2023-11-25', course: 'UI/UX Design' },
  { id: '8', title: 'Machine Learning Quiz', type: 'Quiz', maxScore: 20, date: '2023-12-05', course: 'AI & Machine Learning' },
  { id: '9', title: 'Cloud Computing Assignment', type: 'Assignment', maxScore: 50, date: '2023-12-10', course: 'Cloud Computing' },
  { id: '10', title: 'Cybersecurity Final Exam', type: 'Exam', maxScore: 100, date: '2023-12-15', course: 'Cybersecurity' },
];

export default function GradesPage() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | AssessmentType>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // State for Data
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newGrade, setNewGrade] = useState({
    assessmentId: '',
    studentId: '',
    score: '',
  });

  // Fetch Students and Grades on Load
  useEffect(() => {
    fetchGradesAndStudents();
  }, []);

  const fetchGradesAndStudents = async () => {
    try {
      const [studentsRes, gradesRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/grades')
      ]);
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
      
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setGrades(gradesData);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGrades = filter === 'All' 
    ? grades 
    : grades.filter(g => g.assessmentType === filter);

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGrade.assessmentId || !newGrade.studentId || !newGrade.score) {
      alert('Please fill in all fields');
      return;
    }

    const assessment = ASSESSMENTS.find(a => a.id === newGrade.assessmentId);
    const student = students.find(s => s._id === newGrade.studentId);
    
    if (!assessment || !student) {
      alert('Invalid assessment or student selected');
      return;
    }

    const scoreNum = parseFloat(newGrade.score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > assessment.maxScore) {
      alert(`Score must be a number between 0 and ${assessment.maxScore}`);
      return;
    }

    try {
      const payload = {
        studentId: student._id,
        studentName: student.name,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        assessmentType: assessment.type,
        maxScore: assessment.maxScore,
        score: scoreNum,
      };

      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save grade');
      }

      // Refetch all grades to ensure we have the latest data
      await fetchGradesAndStudents();
      
      setIsModalOpen(false);
      setNewGrade({ assessmentId: '', studentId: '', score: '' });
      alert('Grade saved successfully!');
    } catch (err) {
      alert('Error saving grade: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error(err);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('Are you sure you want to delete this grade record? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/grades/${gradeId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete grade');
      }

      // Refetch grades to update the display
      await fetchGradesAndStudents();
      
      setDeleteConfirmId(null);
      alert('Grade deleted successfully!');
    } catch (err) {
      alert('Error deleting grade: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error(err);
    }
  };

  const getTypeColor = (type: AssessmentType) => {
    switch (type) {
      case 'Exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'Quiz': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Assignment': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeLetter = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  if (loading) return <div className="p-8 text-center">Loading grades...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <span className="text-xl font-bold text-blue-600">EduManage</span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link href="/dashboard" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${pathname === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Dashboard
            </Link>
            <Link href="/" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${pathname === '/' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Students
            </Link>
            <Link href="/timetable" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${pathname === '/timetable' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Timetable
            </Link>
            <Link href="/grades" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${pathname === '/grades' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Grades
            </Link>
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Grade & Assessment Management</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Enter Grade
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            {(['All', 'Quiz', 'Assignment', 'Exam'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Total Grades</p>
              <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Students Graded</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(grades.map(g => g.studentId)).size}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Overall Average</p>
              <p className="text-2xl font-bold text-blue-600">
                {grades.length > 0 
                  ? ((grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length)).toFixed(1) + '%'
                  : '-'}
              </p>
            </div>
          </div>

          {/* Grade Tiles */}
          {filteredGrades.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-700">No grades found</h3>
              <p className="text-gray-500 mt-2">
                {filter === 'All' ? 'Start by entering grades for your students.' : `No ${filter.toLowerCase()} grades found.`}
              </p>
              {filter === 'All' && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enter First Grade
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGrades.map((grade) => (
                <div 
                  key={grade._id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(grade.assessmentType)}`}>
                        {grade.assessmentType}
                      </span>
                      <button
                        onClick={() => handleDeleteGrade(grade._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete grade"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{grade.assessmentTitle}</h3>
                    <p className="text-sm text-gray-600 font-medium mt-1">{grade.studentName}</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Score</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {grade.score}<span className="text-sm text-gray-500 font-normal">/{grade.maxScore}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase">Grade</p>
                        <p className={`text-3xl font-bold ${
                          getGradeLetter(grade.score, grade.maxScore) === 'A' ? 'text-green-600' :
                          getGradeLetter(grade.score, grade.maxScore) === 'B' ? 'text-blue-600' :
                          getGradeLetter(grade.score, grade.maxScore) === 'C' ? 'text-yellow-600' :
                          getGradeLetter(grade.score, grade.maxScore) === 'D' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {getGradeLetter(grade.score, grade.maxScore)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (grade.score / grade.maxScore) >= 0.7 ? 'bg-green-500' :
                          (grade.score / grade.maxScore) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(grade.score / grade.maxScore) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      {((grade.score / grade.maxScore) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Enter Grade Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Enter Grade</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleAddGrade} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                <select 
                  required
                  value={newGrade.assessmentId} 
                  onChange={e => setNewGrade({...newGrade, assessmentId: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select Assessment</option>
                  {ASSESSMENTS.map(a => (
                    <option key={a.id} value={a.id}>{a.title} ({a.type})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select 
                  required
                  value={newGrade.studentId} 
                  onChange={e => setNewGrade({...newGrade, studentId: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                <input 
                  required
                  type="number" 
                  step="0.1"
                  min="0"
                  value={newGrade.score} 
                  onChange={e => setNewGrade({...newGrade, score: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g., 85" 
                />
                {newGrade.assessmentId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Max score: {ASSESSMENTS.find(a => a.id === newGrade.assessmentId)?.maxScore}
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}