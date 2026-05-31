import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, Check, X, Radio, AlertCircle, Search, Edit, Eye } from 'lucide-react';
import StudentModal from '../components/StudentModal';
import StudentProfile from '../components/StudentProfile';

const API_BASE = '/api';
const WS_URL = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;

const RFIDReader = () => {
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [notification, setNotification] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // RFID lookup states
  const [rfidLookup, setRfidLookup] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Fetch available serial ports
  const fetchPorts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/rfid/ports`);
      const data = await response.json();
      
      if (data.success) {
        setPorts(data.data);
        if (data.data.length > 0 && !selectedPort) {
          setSelectedPort(data.data[0].path);
        }
      } else {
        showNotification('error', data.message || 'Failed to fetch ports');
      }
    } catch (error) {
      console.error('Error fetching ports:', error);
      showNotification('error', 'Error fetching ports. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Connect to RFID reader
  const connectReader = async () => {
    if (!selectedPort) {
      showNotification('error', 'Please select a port');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/rfid/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ port: selectedPort, baudRate: 9600 })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        connectWebSocket();
        showNotification('success', 'RFID Reader connected successfully!');
      } else {
        showNotification('error', 'Failed to connect: ' + data.message);
      }
    } catch (error) {
      console.error('Error connecting:', error);
      showNotification('error', 'Connection error. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect from RFID reader
  const disconnectReader = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/rfid/disconnect`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        setIsConnected(false);
        setWsConnected(false);
        if (wsRef.current) {
          wsRef.current.close();
        }
        showNotification('success', 'RFID Reader disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      showNotification('error', 'Disconnect error');
    } finally {
      setLoading(false);
    }
  };

  // Connect to WebSocket for real-time updates
  const connectWebSocket = () => {
    // Clear existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log('Connecting to WebSocket...');
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setWsConnected(true);
      showNotification('success', 'Real-time updates enabled');
      
      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        console.log('WebSocket message:', message);

        if (message.type === 'connected') {
          console.log('WebSocket handshake:', message.message);
        }
        
        if (message.type === 'rfid_scan') {
          const scanData = message.data;
          setLastScan(scanData);
          
          // Add to history with proper timestamp
          setScanHistory(prev => [{
            ...scanData,
            timestamp: message.timestamp || new Date()
          }, ...prev].slice(0, 20)); // Keep last 20 scans
          
          // Show notification
          if (scanData.success) {
            showNotification('success', `✅ ${scanData.student.name} - Attendance Marked`);
            
            // Play success sound (optional)
            playNotificationSound('success');
          } else {
            showNotification('error', `❌ ${scanData.message}`);
            playNotificationSound('error');
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setWsConnected(false);
      showNotification('error', 'WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setWsConnected(false);
      
      // Auto-reconnect if reader is still connected
      if (isConnected) {
        console.log('Attempting to reconnect WebSocket in 3 seconds...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      }
    };

    wsRef.current = ws;
  };

  // Play notification sound
  const playNotificationSound = (type) => {
    try {
      const audio = new Audio(type === 'success' 
        ? 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+zPLTgjMGHm7A7+OZSA0PVqnp7q9Zc==' 
        : 'data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YW4AAAAAAA==');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Sound notification failed:', error);
    }
  };

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  useEffect(() => {
    fetchPorts();
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Render full profile view when requested
  if (showProfile && lookupResult && !lookupResult.error) {
    return (
      <StudentProfile studentId={lookupResult._id} onBack={() => setShowProfile(false)} />
    );
  }

  // Find a student by RFID tag using existing backend endpoint
  const handleFindByRFID = async (e) => {
    e?.preventDefault();
    if (!rfidLookup.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const response = await fetch(`${API_BASE}/students/rfid/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rfidTag: rfidLookup.trim() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLookupResult(data.data.studentId); // Changed to store the entire student object
        showNotification('success', data.message);
        setRfidLookup(''); // Clear input after successful scan
      } else {
        setLookupResult({ error: data.message || 'Attendance marking failed' });
        showNotification('error', data.message || 'Attendance marking failed');
      }
    } catch (error) {
      console.error('RFID lookup error:', error);
      setLookupResult({ error: 'Lookup failed. Check backend.' });
      showNotification('error', 'Lookup failed. Check backend.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center tracking-tight">
          <div className="bg-indigo-500/20 p-2 rounded-lg mr-3 border border-indigo-500/30">
            <Radio className="h-6 w-6 text-indigo-400" />
          </div>
          RFID Reader Control
        </h1>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-xl shadow-lg backdrop-blur-md flex items-start border ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}>
            {notification.type === 'success' ? (
              <Check className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-rose-400" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm tracking-wide">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Connection Status */}
        <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-semibold text-white">Connection Status</h2>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {/* Serial Port Status */}
              <div className={`flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${
                isConnected 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Port Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 mr-2" />
                    Disconnected
                  </>
                )}
              </div>
              
              {/* WebSocket Status */}
              <div className={`flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${
                wsConnected 
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <div className={`h-2 w-2 rounded-full mr-2 ${
                  wsConnected ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'
                }`}></div>
                {wsConnected ? 'Live' : 'Offline'}
              </div>
            </div>
          </div>

          {/* Port Selection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Select Serial Port
                </label>
                <div className="relative">
                  <select
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    disabled={isConnected}
                    className="block w-full pl-4 pr-10 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                  >
                    <option value="" className="bg-slate-900">Select a port...</option>
                    {ports.map(port => (
                      <option key={port.path} value={port.path} className="bg-slate-900">
                        {port.path} {port.manufacturer ? `- ${port.manufacturer}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              
              <button
                onClick={fetchPorts}
                disabled={loading || isConnected}
                className="self-end px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-slate-700"
                title="Refresh port list"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {ports.length === 0 && !loading && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
                <p className="text-sm text-amber-200">
                  No serial ports detected. Make sure your RFID reader is connected via USB.
                </p>
              </div>
            )}

            {/* Connect/Disconnect Buttons */}
            <div>
              {!isConnected ? (
                <button
                  onClick={connectReader}
                  disabled={loading || !selectedPort}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-indigo-500/20"
                >
                  {loading ? 'Connecting...' : 'Connect Reader'}
                </button>
              ) : (
                <button
                  onClick={disconnectReader}
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {loading ? 'Disconnecting...' : 'Disconnect Reader'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RFID Scan */}
        <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Mark Student Present by RFID</h2>
          <form onSubmit={handleFindByRFID} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
              <input
                type="text"
                value={rfidLookup}
                onChange={(e) => setRfidLookup(e.target.value)}
                placeholder="Enter RFID tag to mark present..."
                className="pl-12 pr-4 py-3 w-full bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-200 placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={lookupLoading || !rfidLookup.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
              {lookupLoading ? 'Marking...' : 'Mark Present'}
            </button>
          </form>

          {/* Lookup Result */}
          {lookupResult && (
            <div className="mt-6 border border-slate-700/50 rounded-xl p-5 bg-slate-800/30 backdrop-blur-sm">
              {lookupResult.error ? (
                <div className="flex items-center text-rose-400">
                   <AlertCircle className="h-5 w-5 mr-2" />
                   <p className="text-sm font-medium">{lookupResult.error}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-white">{lookupResult.name}</p>
                    <p className="text-sm text-slate-400 mt-1">Class {lookupResult.class}-{lookupResult.section} • ID: {lookupResult.studentId}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">RFID: {lookupResult.rfidTag}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowProfile(true)}
                      className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Profile
                    </button>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit Student
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Last Scan */}
        {lastScan && (
          <div className={`rounded-xl p-6 border backdrop-blur-md transition-all duration-300 shadow-xl ${
            lastScan.success 
              ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5' 
              : 'bg-rose-500/5 border-rose-500/20 shadow-rose-500/5'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${lastScan.success ? 'text-emerald-400' : 'text-rose-400'}`}>Last Scan Result</h2>
              {lastScan.success ? (
                <div className="bg-emerald-500/20 p-2 rounded-full ring-2 ring-emerald-500/20">
                   <Check className="h-6 w-6 text-emerald-400" />
                </div>
              ) : (
                <div className="bg-rose-500/20 p-2 rounded-full ring-2 ring-rose-500/20">
                   <X className="h-6 w-6 text-rose-400" />
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-sm font-medium text-slate-400">RFID Tag</span>
                <span className="text-sm font-mono bg-slate-800 px-3 py-1 rounded text-slate-200 border border-slate-700">{lastScan.rfidTag}</span>
              </div>
              
              {lastScan.student && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-sm font-medium text-slate-400">Student Name</span>
                    <span className="text-sm font-bold text-white">{lastScan.student.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-sm font-medium text-slate-400">Class & Section</span>
                    <span className="text-sm text-slate-300">{lastScan.student.class}-{lastScan.student.section}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-sm font-medium text-slate-400">Student ID</span>
                    <span className="text-sm font-mono text-slate-300">{lastScan.student.studentId}</span>
                  </div>
                </>
              )}
              
              <div className={`mt-4 p-4 rounded-xl text-center ${
                lastScan.success ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              }`}>
                <p className={`text-base font-semibold ${
                  lastScan.success ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {lastScan.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scan History */}
        <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Scan History</h2>
            {scanHistory.length > 0 && (
              <button
                onClick={() => setScanHistory([])}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
          
          {scanHistory.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/50">
              <Radio className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-400 font-medium">No scans recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">Scan an RFID tag to see it appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {scanHistory.map((scan, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-l-[6px] transition-all hover:bg-slate-800/50 ${
                    scan.success
                      ? 'bg-emerald-900/10 border-emerald-500 shadow-sm shadow-emerald-500/5'
                      : 'bg-rose-900/10 border-rose-500 shadow-sm shadow-rose-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-200">
                        {scan.student ? scan.student.name : `RFID: ${scan.rfidTag}`}
                      </p>
                      {scan.student && (
                        <p className="text-xs text-slate-500 mt-1">
                          {scan.student.class}-{scan.student.section} • ID: {scan.student.studentId}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-600 mt-1.5 uppercase tracking-wide font-medium">
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className={`flex items-center text-sm font-bold ml-4 ${
                      scan.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {scan.success ? (
                        <>
                          <Check className="h-4 w-4 mr-1.5" />
                          Present
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1.5" />
                          {scan.message}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/20 rounded-xl p-5 backdrop-blur-sm">
          <h3 className="font-semibold text-blue-300 mb-3 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Quick Instructions
          </h3>
          <ol className="list-decimal list-inside text-sm text-blue-200/80 space-y-2 ml-1">
            <li>Ensure the RFID reader is connected via USB.</li>
            <li>Use the <span className="font-bold text-blue-200">Refresh</span> button to detect serial ports.</li>
            <li>Select your reader and click <span className="font-bold text-blue-200">Connect Reader</span>.</li>
            <li>Once connected, scan tags to automatically mark attendance.</li>
            <li>Watch the "Live" indicator to verify real-time data flow.</li>
          </ol>
        </div>
      </div>
      {/* Edit Student Modal */}
      {showEditModal && lookupResult && !lookupResult.error && (
        <StudentModal editingStudent={lookupResult} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  );
};

export default RFIDReader;