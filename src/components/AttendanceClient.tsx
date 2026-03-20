// src/components/AttendanceClient.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface AttendanceRecord {
  _id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  month: string;
  year: number;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceClientProps {
  user: any;
  isAdmin: boolean;
}

export default function AttendanceClient({ user, isAdmin }: AttendanceClientProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  // Initialize current month/year
  useEffect(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear().toString();
    setSelectedMonth(`${year}-${month}`);
  }, []);

  // Fetch data
  useEffect(() => {
    if (selectedMonth) {
      fetchData();
    }
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      const url = `/api/attendance?month=${month}&year=${year}`;

      const [studentsRes, attendanceRes] = await Promise.all([
        fetch('/api/students'),
        fetch(url)
      ]);
      
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (attendanceRes.ok) setAttendanceRecords(await attendanceRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (
    studentId: string, 
    studentName: string, 
    date: string, 
    status: AttendanceStatus
  ) => {
    if (!isAdmin) {
      alert('Only administrators can mark attendance.');
      return;
    }

    const saveKey = `${studentId}-${date}`;
    if (saving === saveKey) return;
    
    try {
      setSaving(saveKey);
      const [year, month, day] = date.split('-');
      
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          studentName,
          date,
          status,
          month: `${year}-${month}`,
          year: parseInt(year),
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      const savedRecord = await res.json();

      setAttendanceRecords(prev => {
        const existingIndex = prev.findIndex(
          r => r.studentId === studentId && r.date.startsWith(date)
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], status };
          return updated;
        } else {
          return [...prev, savedRecord];
        }
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save attendance.');
      await fetchData();
    } finally {
      setSaving(null);
    }
  };

  const getAttendanceStatus = (studentId: string, date: string): AttendanceStatus | undefined => {
    return attendanceRecords.find(
      record => record.studentId === studentId && record.date.startsWith(date)
    )?.status as AttendanceStatus | undefined;
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-500 hover:bg-green-600';
      case 'absent': return 'bg-red-500 hover:bg-red-600';
      case 'late': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'excused': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-200 hover:bg-gray-300';
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => status.charAt(0).toUpperCase();

  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split('-');
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  const getMonthName = (monthNum: string) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(monthNum) - 1];
  };

  const calculateAttendanceStats = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(r => r.studentId === studentId);
    return {
      total: studentRecords.length,
      present: studentRecords.filter(r => r.status === 'present').length,
      absent: studentRecords.filter(r => r.status === 'absent').length,
      late: studentRecords.filter(r => r.status === 'late').length,
      excused: studentRecords.filter(r => r.status === 'excused').length,
    };
  };

  const cycleStatus = (currentStatus: AttendanceStatus | undefined): AttendanceStatus => {
    const statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
    if (!currentStatus) return 'present';
    const currentIndex = statuses.indexOf(currentStatus);
    return statuses[(currentIndex + 1) % statuses.length];
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const daysInMonth = getDaysInMonth();
  const [year, month] = selectedMonth.split('-');
  const monthYear = `${getMonthName(month)} ${year}`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (Same as before) */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <span className="text-xl font-bold text-blue-600">EduManage</span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
             {/* Add your links here (Dashboard, Students, etc.) */}
             <Link href="/dashboard" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${pathname === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>Dashboard</Link>
             <Link href="/" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${pathname === '/' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>Students</Link>
             <Link href="/attendance" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${pathname === '/attendance' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>Attendance</Link>
          </nav>
          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Attendance Tracking</h1>
          </div>
          {!isAdmin && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              View Only Mode
            </span>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span className="text-sm text-gray-600">Present</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded"></div><span className="text-sm text-gray-600">Absent</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-500 rounded"></div><span className="text-sm text-gray-600">Late</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded"></div><span className="text-sm text-gray-600">Excused</span></div>
              </div>
            </div>
          </div>

          {/* Monthly Attendance Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">{monthYear}</h2>
              <p className="text-sm text-gray-500">
                {isAdmin ? 'Click on any cell to mark attendance.' : 'Viewing only. Contact admin to update records.'}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 min-w-[200px] border-r border-gray-200">Student</th>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const date = `${year}-${month}-${String(day).padStart(2, '0')}`;
                      const dayOfWeek = new Date(parseInt(year), parseInt(month) - 1, day).toLocaleDateString('en-US', { weekday: 'narrow' });
                      return (
                        <th key={day} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[40px]">
                          <div className="flex flex-col"><span className="font-medium">{day}</span><span className="text-[10px] text-gray-400">{dayOfWeek}</span></div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const date = `${year}-${month}-${String(day).padStart(2, '0')}`;
                        const status = getAttendanceStatus(student._id, date);
                        const saveKey = `${student._id}-${date}`;
                        const isSaving = saving === saveKey;
                        
                        return (
                          <td key={day} className="px-2 py-2 text-center">
                            {/* 🔒 CONDITIONAL RENDERING: Disable button for students */}
                            <button
                              onClick={() => {
                                if (!isAdmin) return; // Double check inside handler
                                const nextStatus = cycleStatus(status);
                                handleMarkAttendance(student._id, student.name, date, nextStatus);
                              }}
                              disabled={!isAdmin || isSaving}
                              className={`w-8 h-8 rounded-lg text-xs font-bold text-white transition-all ${
                                status ? getStatusColor(status) : 'bg-gray-200'
                              } ${
                                !isAdmin ? 'cursor-not-allowed opacity-80' : 
                                isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105 active:scale-95'
                              }`}
                              title={!isAdmin ? "View Only" : `${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not marked'} - Click to change`}
                            >
                              {isSaving ? (
                                <svg className="animate-spin h-4 w-4 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              ) : (
                                status ? getStatusLabel(status) : ''
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section (Visible to everyone) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {students.map((student) => {
              const stats = calculateAttendanceStats(student._id);
              const attendanceRate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : '0';
              return (
                <div key={student._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{student.name}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Attendance Rate</span>
                    <span className={`text-lg font-bold ${parseFloat(attendanceRate) >= 75 ? 'text-green-600' : parseFloat(attendanceRate) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{attendanceRate}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-1 bg-green-50 rounded"><p className="text-gray-500">P</p><p className="font-bold text-green-600">{stats.present}</p></div>
                    <div className="p-1 bg-red-50 rounded"><p className="text-gray-500">A</p><p className="font-bold text-red-600">{stats.absent}</p></div>
                    <div className="p-1 bg-yellow-50 rounded"><p className="text-gray-500">L</p><p className="font-bold text-yellow-600">{stats.late}</p></div>
                    <div className="p-1 bg-blue-50 rounded"><p className="text-gray-500">E</p><p className="font-bold text-blue-600">{stats.excused}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}