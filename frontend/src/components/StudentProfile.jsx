import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Home, IdCard, Droplet, Calendar, Pencil } from 'lucide-react';
import StudentModal from './StudentModal';

const API_BASE = '/api';

const StudentProfile = ({ studentId, onBack }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(`${API_BASE}/students/${studentId}`);
        const text = await res.text();
        // Try parse JSON; if it fails, treat as error
        try {
          const data = JSON.parse(text);
          if (res.ok && data && (data.success === undefined || data.success === true)) {
            setStudent(data.data || data);
          } else {
            setStudent(null);
          }
        } catch {
          setStudent(null);
        }
      } catch (e) {
        console.error('Failed to load student', e);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchStudent();
  }, [studentId]);

  if (!studentId) return null;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map(i => (<div key={i} className="bg-slate-800/50 h-24 rounded-2xl"></div>))}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
            <User className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-xl font-bold text-white">Student not found</p>
            <p className="text-slate-400">The requested student profile could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white flex items-center tracking-tight">
          <div className="bg-indigo-500/20 p-2 rounded-xl mr-3 border border-indigo-500/20">
             <User className="h-6 w-6 text-indigo-400"/>
          </div>
          Student Profile
        </h1>
        <div className="flex space-x-3">
          {onBack && (
            <button onClick={onBack} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium">
              Back
            </button>
          )}
          <button 
            onClick={() => setShowEdit(true)} 
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl inline-flex items-center shadow-lg shadow-indigo-500/20 transition-all font-medium"
          >
            <Pencil className="h-4 w-4 mr-2"/> Edit Profile
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-slate-700/50 shadow-xl relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 relative z-10">
          <div className="flex items-start space-x-6 pb-6 border-b border-slate-700/50 md:col-span-2 md:border-none md:pb-0">
             <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-4xl font-bold text-white">
                {student.name.charAt(0)}
             </div>
             <div>
                <h2 className="text-3xl font-bold text-white">{student.name}</h2>
                <div className="text-indigo-300 font-medium mt-1">{student.department || 'Department'} Student</div>
                <div className="flex items-center mt-3 space-x-3">
                   <span className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-sm text-slate-300 font-mono">
                      ID: {student.studentId}
                   </span>
                   <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 text-sm font-medium">
                      Active
                   </span>
                </div>
             </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white/90 border-b border-slate-700/50 pb-2 mb-4">Academic Information</h3>
            <div className="group">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">RFID Tag</div>
              <div className="font-mono text-slate-200 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/50 group-hover:border-indigo-500/30 transition-colors">
                 {student.rfidTag || '-'}
              </div>
            </div>
            <div className="group">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Class / Section / Roll</div>
              <div className="text-lg text-white font-medium">{student.class}-{student.section} • {student.rollNumber}</div>
            </div>
          </div>

          <div className="space-y-6">
             <h3 className="text-lg font-semibold text-white/90 border-b border-slate-700/50 pb-2 mb-4">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center"><Calendar className="h-3 w-3 mr-1"/>DOB</div>
                  <div className="text-slate-200">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}</div>
               </div>
               <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Gender</div>
                  <div className="text-slate-200">{student.gender}</div>
               </div>
               <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center"><Droplet className="h-3 w-3 mr-1"/>Blood Group</div>
                  <div className="text-slate-200">{student.bloodGroup}</div>
               </div>
            </div>
          </div>

          <div className="space-y-6 md:col-span-2 pt-6 border-t border-slate-700/50">
            <h3 className="text-lg font-semibold text-white/90 mb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center"><User className="h-3 w-3 mr-1"/>Parent Name</div>
                   <div className="text-slate-200 text-lg">{student.parentName}</div>
                </div>
                 <div>
                   <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center"><Phone className="h-3 w-3 mr-1"/>Parent Contact</div>
                   <div className="text-slate-200 font-mono text-lg">{student.parentContact}</div>
                </div>
                 <div>
                   <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center"><Mail className="h-3 w-3 mr-1"/>Parent Email</div>
                   <div className="text-slate-200">{student.parentEmail}</div>
                </div>
                 <div>
                   <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center"><Phone className="h-3 w-3 mr-1"/>Emergency Contact</div>
                   <div className="text-slate-200 font-mono text-lg text-rose-300">{student.emergencyContact}</div>
                </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center"><Home className="h-3 w-3 mr-1"/>Address</div>
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-slate-300 italic">
               "{student.address}"
            </div>
          </div>

          {student.medicalConditions && (
            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center text-rose-400">
                 <div className="h-2 w-2 rounded-full bg-rose-500 mr-2 animate-pulse"></div>
                 Medical Conditions
              </div>
              <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-200">
                 {student.medicalConditions}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <StudentModal editingStudent={student} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
};

export default StudentProfile;


