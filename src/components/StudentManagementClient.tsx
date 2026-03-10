'use client';

import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const COURSE_OPTIONS = [
  'Computer Science',
  'Software Engineering',
  'Web Development',
  'Mobile App Development',
  'Machine Learning',
  'Networking & Security',
  'Blockchain Technology',
  'Robotics & Automation',
] as const;

type CourseOption = typeof COURSE_OPTIONS[number];

const studentSchema = z.object({
  name: z.string().min(1, 'Full name is required').trim(),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  dateOfBirth: z.string().min(1, 'Date of birth is required').refine(
    (date) => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime()) && d <= new Date();
    },
    { message: 'Please enter a valid past date' }
  ),
  mobileNumber: z.string().min(1, 'Mobile number is required').regex(
    /^[+]?[0-9\s\-()]{7,}$/,
    'Please enter a valid mobile number'
  ),
  address: z.string().min(1, 'Address is required').min(5, 'Address must be at least 5 characters'),
  courseModule: z.enum(COURSE_OPTIONS),
});

type Student = z.infer<typeof studentSchema> & { _id: string };
const ITEMS_PER_PAGE = 8;

export default function StudentManagementClient({ user }: { user: any }) {
  const router = useRouter();
  const pathname = usePathname();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [courseModule, setCourseModule] = useState<CourseOption>(COURSE_OPTIONS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (isAdmin) {
      const fetchStudents = async () => {
        try {
          const res = await fetch('/api/students');
          if (!res.ok) throw new Error('Failed to fetch students');
          const data: Student[] = await res.json();
          setStudents(data);
        } catch (err) {
          console.error(err);
          setNotification({ message: 'Failed to load students', type: 'error' });
        } finally {
          setLoading(false);
        }
      };
      fetchStudents();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    setCurrentPage(1);
  }, [students, searchQuery]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter((student) =>
      student.name.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  const validateForm = () => {
    const result = studentSchema.safeParse({
      name,
      email,
      dateOfBirth,
      mobileNumber,
      address,
      courseModule,
    });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const studentData = { name, email, dateOfBirth, mobileNumber, address, courseModule };

    try {
      const url = editingId ? `/api/students/${editingId}` : '/api/students';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      let responseData;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Unexpected response: ${text.substring(0, 200)}...`);
      }

      if (!res.ok) throw new Error(responseData?.error || 'Unknown error');

      if (editingId) {
        setStudents(students.map((s) => (s._id === editingId ? { ...responseData, _id: editingId } : s)));
        setNotification({ message: 'Student updated successfully!', type: 'success' });
      } else {
        setStudents([...students, { ...responseData, _id: responseData._id }]);
        setNotification({ message: 'Student added successfully!', type: 'success' });
      }
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setNotification({ message, type: 'error' });
      console.error(err);
    }
  };

  const handleEdit = (student: Student) => {
    setName(student.name);
    setEmail(student.email);
    const isoDate = student.dateOfBirth;
    const formattedDate = isoDate.split('T')[0];
    setDateOfBirth(formattedDate);
    setMobileNumber(student.mobileNumber);
    setAddress(student.address);
    setCourseModule(student.courseModule as CourseOption);
    setEditingId(student._id);
    setErrors({});
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      const contentType = res.headers.get('content-type');
      let responseData;
      if (contentType && contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Unexpected response: ${text.substring(0, 100)}...`);
      }
      if (!res.ok) throw new Error(responseData?.error || 'Unknown error');
      setStudents(students.filter((s) => s._id !== id));
      setNotification({ message: 'Student deleted successfully!', type: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setNotification({ message, type: 'error' });
      console.error(err);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setDateOfBirth('');
    setMobileNumber('');
    setAddress('');
    setCourseModule(COURSE_OPTIONS[0]);
    setEditingId(null);
    setErrors({});
  };

  const clearSearch = () => setSearchQuery('');

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingStudent(null);
    };
    if (viewingStudent) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [viewingStudent]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-600">Loading Student Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <span className="text-xl font-bold text-blue-600">EduManage</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>
            {/* Students Link */}
            <Link
              href="/"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                pathname === '/'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Students
            </Link>
            {/* Timetable Link */}
            <Link
              href="/timetable"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                pathname === '/timetable'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Timetable
            </Link>
          </nav>
          {/* User Profile in Sidebar */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-gray-800 text-lg hidden sm:block">Student Management</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Sign Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {notification && (
            <div
              className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium max-w-xs animate-fade-in-out ${
                notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {notification.message}
            </div>
          )}

          {viewingStudent && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setViewingStudent(null)}
            >
              <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-semibold">Student Details</h3>
                  <button onClick={() => setViewingStudent(null)} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Name</label>
                      <p className="font-medium">{viewingStudent.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Email</label>
                      <p>{viewingStudent.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">DOB</label>
                      <p>{new Date(viewingStudent.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Mobile</label>
                      <p>{viewingStudent.mobileNumber}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 uppercase">Address</label>
                      <p>{viewingStudent.address}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 uppercase">Course</label>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {viewingStudent.courseModule}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      handleEdit(viewingStudent);
                      setViewingStudent(null);
                    }}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setViewingStudent(null)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Student Management System</h1>
            <p className="text-gray-500 mt-1">
              {isAdmin ? 'Manage all student records.' : 'Add a new Student record.'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingId ? '✏️ Edit Student' : '➕ Add New Student'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.dateOfBirth && <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.mobileNumber && <p className="mt-1 text-xs text-red-600">{errors.mobileNumber}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Module *</label>
                  <select
                    value={courseModule}
                    onChange={(e) => setCourseModule(e.target.value as CourseOption)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                      errors.courseModule ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    {COURSE_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.courseModule && <p className="mt-1 text-xs text-red-600">{errors.courseModule}</p>}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all"
                >
                  {editingId ? 'Update Student' : 'Add Student'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {isAdmin ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-800">Students List</h2>
                <div className="relative w-full sm:w-72">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">🎓</div>
                  <h3 className="text-lg font-medium text-gray-700">No students found</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Try a different search term.' : 'Add your first student above.'}
                  </p>
                  {searchQuery && (
                    <button onClick={clearSearch} className="mt-4 text-blue-600 hover:underline">
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            DOB
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Mobile
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedStudents.map((student) => (
                          <tr key={student._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                              {student.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                              {new Date(student.dateOfBirth).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">{student.mobileNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">{student.courseModule}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setViewingStudent(student)}
                                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                  title="View details"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="mr-2 h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  View
                                </button>

                                <button
                                  onClick={() => handleEdit(student)}
                                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                  title="Edit student"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="mr-2 h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M16.862 4.487l1.687-1.688a1.866 1.866 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                    />
                                  </svg>
                                  Edit
                                </button>

                                <button
                                  onClick={() => handleDelete(student._id)}
                                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                  title="Delete student"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="mr-2 h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                    />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex gap-1">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded border ${
                            currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'
                          }`}
                        >
                          Prev
                        </button>
                        {getPageNumbers().map((p, i) =>
                          p === '...' ? (
                            <span key={i} className="px-3 py-1 text-gray-500">
                              ...
                            </span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => goToPage(p as number)}
                              className={`px-3 py-1 rounded border ${
                                currentPage === p
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        )}
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 rounded border ${
                            currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Non-Admin View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                You do not have permission to view the student list. This section is reserved for administrators only.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}