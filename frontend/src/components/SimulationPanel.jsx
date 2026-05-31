import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

const SimulationPanel = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [gpsCoords, setGpsCoords] = useState({ latitude: '12.9716', longitude: '77.5946' });
  const [rfidHistory, setRfidHistory] = useState([]); // last simulated scans
  const [gpsHistory, setGpsHistory] = useState([]);   // last simulated gps updates

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Handle both old and new API response formats
        const studentsData = data.data || data;
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        if (Array.isArray(studentsData) && studentsData.length > 0) {
          setSelectedStudent(studentsData[0]._id);
        }
      } else {
        if (data.message === 'Token has expired' || data.message === 'Token is not valid') {
          localStorage.removeItem('token');
          localStorage.removeItem('admin');
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const simulateRFID = async () => {
    if (!selectedStudent) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/simulate/rfid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentId: selectedStudent })
      });
      const data = await response.json();
      if (response.ok) {
        alert(`RFID Scan Simulated: ${data.message}`);
        const studentName = students.find(s => s._id === selectedStudent)?.name || 'Unknown';
        setRfidHistory(prev => [{ studentName, timestamp: new Date() }, ...prev].slice(0, 5));
      }
    } catch (error) {
      console.error('Error simulating RFID:', error);
    }
  };

  const simulateGPS = async () => {
    if (!selectedStudent) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/simulate/gps`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          latitude: gpsCoords.latitude,
          longitude: gpsCoords.longitude
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(`GPS Update Simulated: ${data.message}`);
        const studentName = students.find(s => s._id === selectedStudent)?.name || 'Unknown';
        setGpsHistory(prev => [{ studentName, latitude: gpsCoords.latitude, longitude: gpsCoords.longitude, timestamp: new Date() }, ...prev].slice(0, 5));
      }
    } catch (error) {
      console.error('Error simulating GPS:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-medium text-slate-200 flex items-center">
          <div className="w-1.5 h-4 bg-indigo-500 rounded-full mr-2"></div>
          RFID Simulation
        </h3>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {students.map(student => (
            <option key={student._id} value={student._id} className="bg-slate-900 text-slate-200">{student.name}</option>
          ))}
        </select>
        <button
          onClick={simulateRFID}
          disabled={!selectedStudent}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Simulate RFID Scan
        </button>

        {/* RFID history */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Recent Scans</div>
            {rfidHistory.length > 0 && (
              <button
                onClick={() => setRfidHistory([])}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {rfidHistory.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-2">No scans yet</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {rfidHistory.map((h, idx) => (
                <li key={idx} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-700/30">
                  <span className="text-slate-200 font-medium">{h.studentName}</span>
                  <span className="text-xs text-slate-500">{new Date(h.timestamp).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-slate-200 flex items-center">
          <div className="w-1.5 h-4 bg-emerald-500 rounded-full mr-2"></div>
          GPS Simulation
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={gpsCoords.latitude}
            onChange={(e) => setGpsCoords({...gpsCoords, latitude: e.target.value})}
            className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-slate-500"
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={gpsCoords.longitude}
            onChange={(e) => setGpsCoords({...gpsCoords, longitude: e.target.value})}
            className="block w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-slate-500"
          />
        </div>

        {/* Map preview */}
        <div className="rounded-xl overflow-hidden border border-slate-700/50 shadow-inner bg-slate-900">
          <div className="relative w-full h-40">
             <img
              src={`https://staticmap.openstreetmap.de/staticmap.php?center=${gpsCoords.latitude},${gpsCoords.longitude}&zoom=14&size=600x200&markers=${gpsCoords.latitude},${gpsCoords.longitude},red`}
              alt="Map preview"
              className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 pointer-events-none border-inset border-black/10"></div>
          </div>
        </div>

        <button
          onClick={simulateGPS}
          disabled={!selectedStudent}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Simulate GPS Update
        </button>

        {/* GPS history */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Recent Updates</div>
            {gpsHistory.length > 0 && (
              <button
                onClick={() => setGpsHistory([])}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {gpsHistory.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-2">No GPS updates yet</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {gpsHistory.map((h, idx) => (
                <li key={idx} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-700/30">
                  <span className="text-slate-200 font-medium truncate max-w-[150px]">{h.studentName}</span>
                  <div className="text-right">
                     <div className="text-xs text-slate-400 font-mono">{Number(h.latitude).toFixed(4)}, {Number(h.longitude).toFixed(4)}</div>
                     <div className="text-[10px] text-slate-600">{new Date(h.timestamp).toLocaleTimeString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;