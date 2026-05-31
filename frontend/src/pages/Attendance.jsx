import React, { useState, useEffect } from 'react';
import { User, Calendar, RefreshCw } from 'lucide-react';

const API_BASE = '/api';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/attendance?date=${selectedDate}`);
      const data = await response.json();
      if (response.ok) {
        // Handle both old and new API response formats
        const attendanceData = data.data || data;
        const attendanceRecords = Array.isArray(attendanceData) ? attendanceData : [];
        
        // Deduplicate by studentId, keep latest timestamp for the day
        // Filter out records for students that no longer exist
        const latestByStudent = new Map();
        for (const rec of attendanceRecords) {
          // Only process records where studentId is populated (student still exists)
          if (rec.studentId && (rec.studentId._id || rec.studentId)) {
            const key = rec.studentId._id || rec.studentId;
            const prev = latestByStudent.get(key);
            // Use date field if available, otherwise fall back to timestamp
            const recDate = rec.date || rec.timestamp;
            const prevDate = prev ? (prev.date || prev.timestamp) : null;
            if (!prev || new Date(recDate) > new Date(prevDate)) {
              latestByStudent.set(key, rec);
            }
          }
        }

        // Fetch all active students to compute absentees
        const studentsRes = await fetch(`${API_BASE}/students?isActive=true`);
        const studentsData = await studentsRes.json();
        const students = studentsData.data || studentsData;

        const presentRows = Array.from(latestByStudent.values());
        const presentIds = new Set(presentRows.map(r => (r.studentId?._id || r.studentId)));

        const absentRows = students
          .filter(s => !presentIds.has(s._id))
          .map(s => ({
            _id: `absent-${s._id}`,
            studentId: s._id,
            studentName: s.name,
            timestamp: null,
            status: 'absent',
            entryType: '-'
          }));

        // Combine present first, then absent
        setAttendance([...presentRows, ...absentRows]);
      } else {
        if (data.message === 'Token has expired' || data.message === 'Token is not valid' || response.status === 401) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-1/4 bg-slate-800 rounded-lg"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800/50 h-24 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Attendance Records</h1>
          <p className="text-slate-400 mt-1">Track daily student attendance</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-slate-800 border-none text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium"
          />
          <button
            onClick={loadAttendance}
            className="group px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 flex items-center shadow-lg shadow-indigo-500/20"
          >
            <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
        {attendance.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="mx-auto h-24 w-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
               <Calendar className="h-12 w-12 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white">No records found</h3>
            <p className="mt-2 text-slate-400 max-w-sm mx-auto">No attendance data is available for the selected date. Students may not have checked in yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    Student Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    Check-in Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    Entry Method
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {attendance.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-800/30 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 flex items-center justify-center border border-indigo-500/20">
                          <User className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-white">{record.studentName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300 font-mono">
                         {record.timestamp ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-slate-600">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        record.status === 'present' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : record.status === 'late'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            record.status === 'present' ? 'bg-emerald-500' :
                            record.status === 'late' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}></div>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {record.entryType === 'RFID' ? (
                          <span className="flex items-center gap-1.5">
                              <span className="p-1 rounded bg-slate-800 border border-slate-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </span>
                              RFID Scan
                          </span>
                      ) : (
                          <span className="text-slate-600 font-mono">{record.entryType}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
