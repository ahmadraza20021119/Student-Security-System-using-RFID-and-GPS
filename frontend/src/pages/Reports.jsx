import React, { useState, useEffect } from 'react';
import { Download, Users, RefreshCw } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('monthly_attendance');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (response.ok) {
        setStudents(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      let url = '';

      if (reportType === 'monthly_attendance') {
        url = `/api/attendance/summary/monthly?month=${selectedMonth}&year=${selectedYear}`;
        if (selectedStudent) {
          url += `&studentId=${selectedStudent}`;
        }
      } else {
        // Placeholder for other reports
        alert(`Generating ${reportType} report...`);
        setLoading(false);
        return;
      }

      const response = await fetch(url);

      const data = await response.json();
      if (data.success) {
        setReportData(data.data);
      } else {
        alert(data.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData || !reportData.report) return;

    const headers = ['Name', 'Student ID', 'Department', 'Section', 'Days Present', 'Total Working Days', 'Percentage'];
    const rows = reportData.report.map(student => [
      student.name,
      student.studentId,
      student.department,
      student.section,
      student.presentDays,
      student.totalWorkingDays,
      student.percentage + '%'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${selectedMonth}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-400 mt-1">Generate comprehensive attendance summaries</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-xl border border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <div className="bg-indigo-500/20 p-1.5 rounded-lg mr-2 border border-indigo-500/20">
             <Users className="h-4 w-4 text-indigo-400" />
          </div>
          Report Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide pl-1">Report Type</label>
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="block w-full pl-4 pr-10 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 appearance-none transition-shadow"
              >
                <option value="monthly_attendance" className="bg-slate-900">Monthly Attendance Percentage</option>
                <option value="attendance_log" disabled className="bg-slate-900 text-slate-600">Daily Attendance Log (Coming Soon)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          
          {reportType === 'monthly_attendance' && (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide pl-1">Month</label>
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="block w-full pl-4 pr-10 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 appearance-none transition-shadow"
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide pl-1">Year</label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="block w-full pl-4 pr-10 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 appearance-none transition-shadow"
                  >
                    {years.map(y => (
                      <option key={y} value={y} className="bg-slate-900">{y}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide pl-1">Student (Optional)</label>
                <div className="relative">
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="block w-full pl-4 pr-10 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 appearance-none transition-shadow"
                  >
                    <option value="" className="bg-slate-900">All Students</option>
                    {students.map(student => (
                      <option key={student._id} value={student._id} className="bg-slate-900">
                        {student.name} ({student.studentId})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex space-x-4 pt-4 border-t border-slate-700/30">
          <button
            onClick={generateReport}
            disabled={loading}
            className="group bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
          >
            {loading ? (
              <>
                 <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                 Generating...
              </>
            ) : (
              'Generate Report'
            )}
          </button>
          
          {reportData && (
             <button
             onClick={downloadCSV}
             className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center font-medium"
           >
             <Download className="mr-2 h-4 w-4" />
             Download CSV
           </button>
          )}
        </div>
      </div>

      {reportData && reportType === 'monthly_attendance' && (
        <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-slate-700/50">
          <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 flex justify-between items-center backdrop-blur-md">
             <h3 className="text-lg font-bold text-white flex items-center">
               <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
               Attendance Report - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
             </h3>
             <span className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-sm text-slate-300">
               Total Working Days: <span className="font-bold text-white ml-2">{reportData.totalWorkingDays}</span>
             </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/50">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">Reg No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">Dept / Section</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-indigo-300 uppercase tracking-wider">Days Present</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-indigo-300 uppercase tracking-wider">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {reportData.report.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-500">
                           <div className="flex flex-col items-center">
                              <Users className="h-10 w-10 mb-3 opacity-20" />
                              <p>No students found matching your criteria.</p>
                           </div>
                        </td>
                    </tr>
                ) : (
                    reportData.report.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono bg-indigo-900/0">{student.studentId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{student.department} - {student.section}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium text-center">{student.presentDays}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-lg border ${
                              parseFloat(student.percentage) >= 75 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : parseFloat(student.percentage) >= 60 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                              {student.percentage}%
                          </span>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;