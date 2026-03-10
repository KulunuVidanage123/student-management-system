// src/app/timetable/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type EventType = 'class' | 'exam' | 'event';

interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  title: string;
  type: EventType;
  location: string;
  instructor?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
];

// Mock Data
const INITIAL_SCHEDULE: ScheduleItem[] = [
  { id: '1', day: 'Monday', time: '09:00 AM', title: 'Web Development', type: 'class', location: 'Lab 1', instructor: 'Mr. Smith' },
  { id: '2', day: 'Monday', time: '11:00 AM', title: 'Database Systems', type: 'class', location: 'Room 204', instructor: 'Dr. Jones' },
  { id: '3', day: 'Tuesday', time: '10:00 AM', title: 'Midterm Exam', type: 'exam', location: 'Hall A', instructor: 'Prof. Brown' },
  { id: '4', day: 'Wednesday', time: '02:00 PM', title: 'Guest Lecture: AI', type: 'event', location: 'Auditorium', instructor: 'Dr. Lee' },
  { id: '5', day: 'Thursday', time: '09:00 AM', title: 'Mobile App Dev', type: 'class', location: 'Lab 2', instructor: 'Ms. Davis' },
  { id: '6', day: 'Friday', time: '11:00 AM', title: 'Project Presentation', type: 'event', location: 'Room 301', instructor: 'Mr. Smith' },
];

export default function TimetablePage() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | EventType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);

  // Form State
  const [newItem, setNewItem] = useState<Partial<ScheduleItem>>({
    day: 'Monday',
    time: '09:00 AM',
    type: 'class',
    location: '',
    title: '',
    instructor: ''
  });

  const filteredSchedule = filter === 'all' 
    ? schedule 
    : schedule.filter(item => item.type === filter);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.location) return;
    
    const item: ScheduleItem = {
      id: Date.now().toString(),
      day: newItem.day as string,
      time: newItem.time as string,
      title: newItem.title as string,
      type: newItem.type as EventType,
      location: newItem.location as string,
      instructor: newItem.instructor || 'TBA'
    };

    setSchedule([...schedule, item]);
    setIsModalOpen(false);
    setNewItem({ day: 'Monday', time: '09:00 AM', type: 'class', location: '', title: '', instructor: '' });
  };

  const getTypeColor = (type: EventType) => {
    switch (type) {
      case 'class': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'event': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <h1 className="text-xl font-bold text-gray-800">Timetable & Scheduling</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Schedule
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            {(['all', 'class', 'exam', 'event'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                  filter === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type} {type !== 'all' && 's'}
              </button>
            ))}
          </div>

          {/* Grid Layout */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Time</th>
                  {DAYS.map(day => (
                    <th key={day} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {TIME_SLOTS.map(time => (
                  <tr key={time} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap bg-gray-50 border-r border-gray-200">
                      {time}
                    </td>
                    {DAYS.map(day => {
                      const item = filteredSchedule.find(s => s.day === day && s.time === time);
                      return (
                        <td key={`${day}-${time}`} className="px-2 py-2 align-top h-24 border-r border-gray-100 relative group">
                          {item ? (
                            <div className={`h-full p-2 rounded-lg border text-xs ${getTypeColor(item.type)} cursor-pointer hover:shadow-md transition-shadow`}>
                              <div className="font-bold truncate">{item.title}</div>
                              <div className="mt-1 opacity-90 truncate">{item.location}</div>
                              {item.instructor && <div className="mt-0.5 opacity-75 truncate">{item.instructor}</div>}
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setNewItem({ ...newItem, day: day, time: time });
                                setIsModalOpen(true);
                              }}
                              className="w-full h-full flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Add Schedule Item</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Math Class" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select value={newItem.day} onChange={e => setNewItem({...newItem, day: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <select value={newItem.time} onChange={e => setNewItem({...newItem, time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as EventType})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="class">Class</option>
                    <option value="exam">Exam</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input required type="text" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Room 101" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor (Optional)</label>
                <input type="text" value={newItem.instructor} onChange={e => setNewItem({...newItem, instructor: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mr. Smith" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}