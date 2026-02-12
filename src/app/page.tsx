'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';

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

export default function Home() {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [courseModule, setCourseModule] = useState<CourseOption>(COURSE_OPTIONS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // UI state
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch students
  useEffect(() => {
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
  }, []);

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
      result.error.issues.forEach(issue => {
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

    if (!validateForm()) {
      return;
    }

    const studentData = {
      name,
      email,
      dateOfBirth,
      mobileNumber,
      address,
      courseModule,
    };

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

      if (!res.ok) {
        const errorMessage = responseData?.error || 'Unknown error';
        throw new Error(errorMessage);
      }

      if (editingId) {
        setStudents(students.map(s => s._id === editingId ? { ...responseData, _id: editingId } : s));
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
    setDateOfBirth(student.dateOfBirth);
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

      if (!res.ok) {
        const errorMessage = responseData?.error || 'Unknown error';
        throw new Error(`Delete failed: ${errorMessage}`);
      }

      setStudents(students.filter(s => s._id !== id));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-600">Loading student management system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium max-w-xs animate-fade-in-out ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Student Management System
          </h1>
        </header>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-10 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {editingId ? '✏️ Edit Student' : '➕ Add New Student'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+94 77 123 4567"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.mobileNumber && <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>}
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  id="address"
                  placeholder="123 Main St, Colombo, Sri Lanka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              </div>

              {/* Course Module */}
              <div className="sm:col-span-2">
                <label htmlFor="courseModule" className="block text-sm font-medium text-gray-700 mb-1">
                  Course Module *
                </label>
                <select
                  id="courseModule"
                  value={courseModule}
                  onChange={(e) => setCourseModule(e.target.value as CourseOption)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white ${
                    errors.courseModule ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  {COURSE_OPTIONS.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                {errors.courseModule && <p className="mt-1 text-sm text-red-600">{errors.courseModule}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {editingId ? 'Update Student' : 'Add Student'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Students List</h2>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No students found</h3>
              <p className="text-gray-500">Add your first student using the form above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">DOB</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {new Date(student.dateOfBirth).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{student.mobileNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{student.courseModule}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student._id)}
                          className="text-red-600 hover:text-red-900 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}