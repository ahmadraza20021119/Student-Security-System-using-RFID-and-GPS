import React, { useState, useEffect } from 'react';
import { User, Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import StudentProfile from '../components/StudentProfile';
import StudentModal from '../components/StudentModal';

const API_BASE = '/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudentId, setViewingStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE}/students`);
      const data = await response.json();
      if (response.ok) {
        setStudents(data.data || data);
      } else {
        if (data.message === 'Token has expired' || data.message === 'Token is not valid' || response.status === 401) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setShowModal(true);
  };

  const handleDelete = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/students/${studentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchStudents();
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingStudent(null);
    fetchStudents(); // Refresh the list
  };

  const filteredStudents = students.filter(student => {
    const term = searchTerm.toLowerCase();
    return (
      (student.name?.toLowerCase() || '').includes(term) ||
      (student.studentId?.toLowerCase() || '').includes(term) ||
      (student.rfidTag?.toLowerCase() || '').includes(term) ||
      (student.class?.toLowerCase() || '').includes(term) ||
      (student.section?.toLowerCase() || '').includes(term) ||
      (student.department?.toLowerCase() || '').includes(term) ||
      (student.rollNumber ? String(student.rollNumber).toLowerCase().includes(term) : false)
    );
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-1/4 bg-slate-800 rounded-lg"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-slate-800/50 h-20 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (viewingStudentId) {
    return <StudentProfile studentId={viewingStudentId} onBack={() => setViewingStudentId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">Student Management</h1>
           <p className="text-slate-400 mt-1">Manage student records and RFID tags</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="group bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-200 flex items-center font-medium"
        >
          <div className="bg-white/20 rounded-lg p-1 mr-2 group-hover:scale-110 transition-transform">
             <Plus className="h-4 w-4" />
          </div>
          Add New Student
        </button>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-slate-700/50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by name, ID, class, roll, or RFID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-slate-500 transition-all"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Student Details
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Academic Info
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-slate-800/30 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center border border-indigo-500/20">
                        <User className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-white">{student.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 font-mono">ID: {student.studentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">
                      <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs border border-slate-700 mr-2">Sec {student.section}</span>
                      {student.class && <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs border border-slate-700">Class {student.class}</span>}
                    </div>
                    {student.rfidTag && (
                      <div className="text-xs text-slate-500 mt-1 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></div>
                        RFID Active
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => setViewingStudentId(student._id)}
                        className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        title="View Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No students found</p>
            <p className="text-sm mt-1">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* Student Modal */}
      {showModal && (
        <StudentModal
          editingStudent={editingStudent}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Students;