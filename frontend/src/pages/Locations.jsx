import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, RefreshCw, Navigation, Navigation2, Search, Battery, Signal, Zap, ShieldAlert, ShieldCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers for Bound status
const createMarkerIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = createMarkerIcon('red');
const blueIcon = createMarkerIcon('blue');

const API_BASE = '/api';

// Geofence Config (College Address: Poonamallee High Rd, Maduravoyal, Chennai)
const SCHOOL_ZONE = {
  center: [13.0636, 80.1612], 
  radius: 600 // Meters
};

// Custom Map Updater component to center map on new locations
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(SCHOOL_ZONE.center);
  const [zoom, setZoom] = useState(14);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE}/locations`);
      const result = await response.json();
      if (response.ok && result.success) {
        // Enforce geofence check on frontend for live calculation
        const enrichedData = (result.data || []).map(loc => {
          const dist = L.latLng(SCHOOL_ZONE.center).distanceTo(
            L.latLng(loc.coordinates.latitude, loc.coordinates.longitude)
          );
          return {
            ...loc,
            isOutOfBounds: dist > SCHOOL_ZONE.radius,
            distance: dist
          };
        });
        setLocations(enrichedData);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => 
      loc.studentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.studentId?.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [locations, searchQuery]);

  const alerts = useMemo(() => {
    return locations.filter(loc => loc.isOutOfBounds);
  }, [locations]);

  const handleFocusLocation = (location) => {
    setSelectedLocation(location);
    setMapCenter([location.coordinates.latitude, location.coordinates.longitude]);
    setZoom(16);
  };

  const getBatteryIcon = (level) => {
    if (level === null) return null;
    if (level > 80) return <Battery className="h-3 w-3 text-emerald-400" />;
    if (level > 20) return <Battery className="h-3 w-3 text-amber-400" />;
    return <Battery className="h-3 w-3 text-red-500 animate-pulse" />;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-1/4 bg-slate-800 rounded-lg"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
            <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Live Security Monitor</h1>
          <p className="text-slate-400 mt-1">Geofence: {SCHOOL_ZONE.radius}m Radius</p>
        </div>
        <div className="flex items-center gap-3">
          {alerts.length > 0 && (
            <div className="animate-bounce flex items-center px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/30 text-xs font-bold text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="mr-2 h-4 w-4" />
              {alerts.length} ALERT{alerts.length > 1 ? 'S' : ''} DETECTED
            </div>
          )}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 transition-all"
            />
          </div>
          <div className="flex items-center px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-700/50 text-sm text-indigo-300">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin text-indigo-400" />
            <span className="font-medium">Live</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-1 shadow-2xl border border-slate-700/50 h-[600px] flex flex-col overflow-hidden relative">
          <div className="px-5 py-4 border-b border-slate-700/30 flex justify-between items-center bg-slate-900/20 backdrop-blur-md">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-indigo-400" />
              Geospatial View
            </h3>
            <div className="flex items-center space-x-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center ${alerts.length > 0 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {alerts.length > 0 ? <ShieldAlert className="h-3 w-3 mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                {alerts.length > 0 ? 'Violation Detected' : 'Perimeter Secure'}
              </span>
            </div>
          </div>
          <div className="flex-1 m-1 rounded-2xl overflow-hidden relative z-0 border border-slate-700/30">
            <MapContainer 
              center={mapCenter} 
              zoom={zoom} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <ChangeView center={mapCenter} zoom={zoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* The Geofence Circle */}
              <Circle
                center={SCHOOL_ZONE.center}
                radius={SCHOOL_ZONE.radius}
                pathOptions={{ 
                  color: alerts.length > 0 ? '#ef4444' : '#6366f1', 
                  fillColor: alerts.length > 0 ? '#ef4444' : '#6366f1', 
                  fillOpacity: 0.1,
                  dashArray: '10, 10'
                }}
              />

              {filteredLocations.map((loc) => (
                <Marker 
                  key={loc._id} 
                  position={[loc.coordinates.latitude, loc.coordinates.longitude]}
                  icon={loc.isOutOfBounds ? redIcon : blueIcon}
                >
                  <Popup className="custom-popup">
                    <div className="p-3 min-w-[180px]">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`font-bold text-sm ${loc.isOutOfBounds ? 'text-red-400' : 'text-indigo-400'}`}>
                          {loc.studentId?.name || 'Unknown'}
                        </div>
                        {loc.isOutOfBounds && <ShieldAlert className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="space-y-1.5 border-t border-slate-700/30 pt-2">
                         <div className={`text-[10px] font-bold py-1 px-2 rounded-lg text-center ${loc.isOutOfBounds ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                           {loc.isOutOfBounds ? 'OUT OF BOUNDS' : 'SAFE ZONE'}
                         </div>
                        <div className="text-[10px] flex justify-between">
                          <span className="text-slate-500">Distance:</span>
                          <span className="text-slate-300 font-mono">{Math.round(loc.distance)}m from School</span>
                        </div>
                        <div className="text-[10px] flex justify-between">
                          <span className="text-slate-500">Signal:</span>
                          <span className="text-indigo-300 font-mono">{loc.signalStrength || 'N/A'} dBm</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Location List */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-[600px]">
          {/* Active Nodes List */}
          <div className="glass-card rounded-3xl p-6 shadow-2xl border border-slate-700/50 flex flex-col flex-1">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                Security Queue
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {filteredLocations.length} Online
              </span>
            </h3>
            
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {filteredLocations.map((location) => (
                <div 
                  key={location._id} 
                  onClick={() => handleFocusLocation(location)}
                  className={`group flex flex-col p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    location.isOutOfBounds 
                      ? 'bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20' 
                      : selectedLocation?._id === location._id 
                      ? 'bg-slate-800/80 border-indigo-500 ring-1 ring-indigo-500/20 shadow-lg' 
                      : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center min-w-0">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 ${
                        location.isOutOfBounds ? 'bg-red-500/20 border-red-500/30' : 'bg-indigo-500/10 border-indigo-500/10'
                      }`}>
                        <Navigation2 className={`h-5 w-5 ${location.isOutOfBounds ? 'text-red-400 animate-pulse' : 'text-indigo-400'} ${selectedLocation?._id === location._id ? 'animate-bounce' : ''}`} />
                      </div>
                      <div className="ml-3 truncate">
                        <div className="text-sm font-bold text-white tracking-wide truncate">
                          {location.studentId?.name || 'Unknown Node'}
                        </div>
                        <div className={`text-[9px] font-bold px-1.5 rounded w-fit ${location.isOutOfBounds ? 'text-red-400' : 'text-emerald-400'}`}>
                          {location.isOutOfBounds ? 'OUT OF BOUNDS' : 'IN SAFE ZONE'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 mb-1">LIVE</div>
                      <div className="text-[9px] text-slate-600 font-mono">
                        {new Date(location.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700/20">
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <Signal className="h-3 w-3 text-indigo-400" />
                      <span className="font-mono">{Math.round(location.distance)}m dist</span>
                    </div>
                    <div className="flex items-center justify-end space-x-2 text-[10px]">
                      {location.batteryLevel !== null ? (
                        <>
                          {getBatteryIcon(location.batteryLevel)}
                          <span className="text-slate-400">{location.batteryLevel}%</span>
                        </>
                      ) : (
                        <div className="flex items-center space-x-1 text-slate-500">
                           <Zap className="h-3 w-3" />
                           <span>Power Connected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;


