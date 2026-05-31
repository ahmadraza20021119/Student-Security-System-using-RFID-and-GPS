import React, { useState, useEffect } from 'react';
import { Users, Calendar, RefreshCw, Trash2, RotateCcw } from 'lucide-react';
import SimulationPanel from '../components/SimulationPanel';

const API_BASE = '/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, absentToday: 0 });
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/stats`);
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      } else {
        if (data.message === 'Token has expired' || data.message === 'Token is not valid' || response.status === 401) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupOrphanedRecords = async () => {
    setCleanupLoading(true);
    try {
      const response = await fetch(`${API_BASE}/dashboard/cleanup`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Successfully cleaned up ${data.deletedCount} orphaned attendance records`);
        // Refresh stats after cleanup
        await fetchStats();
      } else {
        alert('Cleanup failed: ' + data.message);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Cleanup failed. Please try again.');
    } finally {
      setCleanupLoading(false);
    }
  };

  const resetAttendance = async () => {
    setResetLoading(true);
    try {
      const response = await fetch(`${API_BASE}/dashboard/reset-attendance`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Successfully reset attendance status for ${data.modifiedCount} students`);
        // Refresh stats after reset
        await fetchStats();
      } else {
        alert('Reset failed: ' + data.message);
      }
    } catch (error) {
      console.error('Reset error:', error);
      alert('Reset failed. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-800 rounded"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/50 h-32 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 mt-1">Real-time monitoring and statistics</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchStats}
            className="group px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-200 flex items-center backdrop-blur-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </button>
          <button
            onClick={cleanupOrphanedRecords}
            disabled={cleanupLoading}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-200 border border-red-500/20 transition-all duration-200 flex items-center backdrop-blur-sm disabled:opacity-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {cleanupLoading ? 'Cleaning...' : 'Cleanup Data'}
          </button>
          <button
            onClick={resetAttendance}
            disabled={resetLoading}
            className="px-4 py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-200 border border-orange-500/20 transition-all duration-200 flex items-center backdrop-blur-sm disabled:opacity-50"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {resetLoading ? 'Resetting...' : 'Reset Attendance'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Total Students Card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-indigo-500/10 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Users className="h-24 w-24 text-white transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center">
            <div className="p-3 bg-indigo-500/20 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Students</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalStudents}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center text-xs text-slate-500">
            <span className="text-indigo-400 font-medium mr-1">Registered</span> in the system
          </div>
        </div>

        {/* Present Today Card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-emerald-500/10 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Calendar className="h-24 w-24 text-emerald-400 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center">
            <div className="p-3 bg-emerald-500/20 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Present Today</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.presentToday}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center text-xs text-slate-500">
             <div className="w-full bg-slate-700/50 rounded-full h-1.5 mr-2">
               <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${stats.totalStudents ? (stats.presentToday / stats.totalStudents) * 100 : 0}%` }}></div>
             </div>
             <span>{stats.totalStudents ? Math.round((stats.presentToday / stats.totalStudents) * 100) : 0}%</span>
          </div>
        </div>

        {/* Absent Today Card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:shadow-rose-500/10 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Calendar className="h-24 w-24 text-rose-400 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="flex items-center">
            <div className="p-3 bg-rose-500/20 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-8 w-8 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Absent Today</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.absentToday}</p>
            </div>
          </div>
           <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center text-xs text-slate-500">
             <div className="w-full bg-slate-700/50 rounded-full h-1.5 mr-2">
               <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${stats.totalStudents ? (stats.absentToday / stats.totalStudents) * 100 : 0}%` }}></div>
             </div>
             <span>{stats.totalStudents ? Math.round((stats.absentToday / stats.totalStudents) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Simulation Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
            Hardware Simulation
        </h2>
        <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-6 max-w-2xl">
            Simulate RFID scans and GPS updates for system testing. These actions verify real-time data flow without physical hardware.
          </p>
          <div className="space-y-4">
            <SimulationPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;