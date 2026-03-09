// src/app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/students');
        if (res.ok) {
          const students = await res.json();
          setStudentCount(students.length);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center mb-10">
          <Link 
            href="/dashboard" 
            className="text-2xl font-bold text-blue-600 hover:text-blue-800 transition"
          >
            Dashboard
          </Link>
          <span className="mx-4 text-gray-400">/</span>
          <Link 
            href="/" 
            className="text-lg text-gray-600 hover:text-gray-900 transition"
          >
            Student Management
          </Link>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-blue-600">
              {loading ? '...' : studentCount}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Course Distribution</h3>
            <p className="text-gray-600">Web Development: 42%</p>
            <p className="text-gray-600">Computer Science: 28%</p>
            <p className="text-gray-600">Other: 30%</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Recent Activity</h3>
            <p className="text-gray-600">3 new students added today</p>
            <p className="text-gray-600">12 updates this week</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Manage Students
            </Link>
            <button 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              onClick={() => alert('Export feature coming soon!')}
            >
              Export Data
            </button>
            <button 
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              onClick={() => alert('Analytics feature coming soon!')}
            >
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}