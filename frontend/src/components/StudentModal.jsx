import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

const StudentModal = ({ editingStudent, onClose }) => {
  const [formData, setFormData] = useState({
    name: '', studentId: '', rfidTag: '', section: '',
    dateOfBirth: '', gender: 'Male', studentEmail: '', department: 'CSE',
    address: '', emergencyContact: '', bloodGroup: 'O+', medicalConditions: ''
  });

  useEffect(() => {
    if (editingStudent) {
      setFormData({
        name: editingStudent.name,
        studentId: editingStudent.studentId,
        rfidTag: editingStudent.rfidTag,
        section: editingStudent.section,
        dateOfBirth: editingStudent.dateOfBirth?.split('T')[0] || '',
        gender: editingStudent.gender,
        department: editingStudent.department || 'CSE',
        studentEmail: editingStudent.studentEmail,
        address: editingStudent.address,
        emergencyContact: editingStudent.emergencyContact,
        bloodGroup: editingStudent.bloodGroup,
        medicalConditions: editingStudent.medicalConditions || '',
      });
    }
  }, [editingStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingStudent 
        ? `${API_BASE}/students/${editingStudent._id}`
        : `${API_BASE}/students`;
      const method = editingStudent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onClose();
      } else {
        // Try to display a meaningful error
        let message = 'Failed to save student';
        try {
          const data = await response.json();
          if (data?.errors && Array.isArray(data.errors)) {
            message = data.errors.map(err => err.message).join('\n');
          } else if (data?.message) {
            message = data.message;
          }
        } catch (e) {
           // If JSON fails, it might be text
           try {
             const text = await response.text();
             if (text) message = text;
           } catch (e2) {}
        }
        alert(message);
      }
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Error saving student. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
       name: '', studentId: '', rfidTag: '', section: '',
       dateOfBirth: '', gender: 'Male', studentEmail: '', department: 'CSE',
       address: '', emergencyContact: '', bloodGroup: 'O+', medicalConditions: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={handleCancel}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom glass-card rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-slate-700/50">
          <form onSubmit={handleSubmit}>
            <div className="bg-slate-900/50 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-slate-700/50">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="bg-indigo-500/20 p-2 rounded-lg mr-3 border border-indigo-500/20 text-indigo-400">
                    {editingStudent ? (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                       </svg>
                    ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                       </svg>
                    )}
                  </span>
                  {editingStudent ? 'Edit Student Profile' : 'Register New Student'}
                </h3>
                <button type="button" onClick={handleCancel} className="text-slate-400 hover:text-white transition-colors">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="col-span-1 md:col-span-2 bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/10 mb-2">
                   <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-wide mb-3">Core Information</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 placeholder-slate-500 transition-shadow"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Deparment *</label>
                        <div className="relative">
                           <select
                             value={formData.department}
                             onChange={(e) => setFormData({...formData, department: e.target.value})}
                             className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 appearance-none transition-shadow"
                           >
                              {['CSE', 'ECE', 'EEE', 'IT', 'AIML', 'DS', 'ME', 'CE', 'CIV', 'BIO', 'CHE', 'Other'].map(dept => (
                                 <option key={dept} value={dept} className="bg-slate-900">{dept}</option>
                              ))}
                           </select>
                           <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                           </div>
                        </div>
                      </div>
        
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Register No / Student ID *</label>
                        <input
                          type="text"
                          required
                          value={formData.studentId}
                          onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                          className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 font-mono placeholder-slate-500 transition-shadow"
                          placeholder="e.g. 21X41A0501"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">RFID Tag UID *</label>
                        <input
                          type="text"
                          required
                          value={formData.rfidTag}
                          onChange={(e) => setFormData({...formData, rfidTag: e.target.value})}
                          className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 font-mono placeholder-slate-500 transition-shadow"
                          placeholder="Place cursor here & scan tag"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Roll / Section *</label>
                        <input
                          type="text"
                          required
                          value={formData.section}
                          onChange={(e) => setFormData({...formData, section: e.target.value.toUpperCase()})}
                          className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 placeholder-slate-500 transition-shadow"
                          placeholder="e.g. A"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Student Email *</label>
                        <input
                          type="email"
                          required
                          value={formData.studentEmail}
                          onChange={(e) => setFormData({...formData, studentEmail: e.target.value})}
                          className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 placeholder-slate-500 transition-shadow"
                          placeholder="student@college.edu"
                        />
                      </div>
                   </div>
                </div>
                
                <div className="space-y-4">
                   <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-700/50 pb-1">Personal Details</h4>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Date of Birth</label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                          className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 placeholder-slate-500 transition-shadow"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Gender *</label>
                        <div className="relative">
                            <select
                              value={formData.gender}
                              onChange={(e) => setFormData({...formData, gender: e.target.value})}
                              className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 appearance-none transition-shadow"
                            >
                              <option value="Male" className="bg-slate-900">Male</option>
                              <option value="Female" className="bg-slate-900">Female</option>
                              <option value="Other" className="bg-slate-900">Other</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Blood Group *</label>
                        <div className="relative">
                           <select
                             value={formData.bloodGroup}
                             onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                             className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 appearance-none transition-shadow"
                           >
                             {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                               <option key={bg} value={bg} className="bg-slate-900">{bg}</option>
                             ))}
                           </select>
                           <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                           </div>
                        </div>
                      </div>
                   </div>
                   
                   <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Address *</label>
                      <textarea
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        rows="3"
                        className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 placeholder-slate-500 transition-shadow"
                        placeholder="Residential Address"
                      />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-700/50 pb-1">Emergency & Health</h4>
                   
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Emergency Contact *</label>
                      <input
                        type="tel"
                        required
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                        className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 placeholder-slate-500 transition-shadow"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 ml-1">Medical Conditions</label>
                      <textarea
                        value={formData.medicalConditions}
                        onChange={(e) => setFormData({...formData, medicalConditions: e.target.value})}
                        rows="3"
                        className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 placeholder-slate-500 transition-shadow"
                        placeholder="Any medical conditions, allergies, or special requirements..."
                      />
                    </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700/50 flex flex-row-reverse gap-3">
              <button
                type="submit"
                className="inline-flex justify-center rounded-xl shadow-lg shadow-indigo-500/20 px-6 py-2.5 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all"
              >
                {editingStudent ? 'Update Profile' : 'Register Student'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex justify-center rounded-xl border border-slate-700 px-6 py-2.5 bg-transparent text-base font-medium text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentModal;