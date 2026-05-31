const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true // Only store latest location per student
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  accuracy: {
    type: Number,
    default: 0 // GPS accuracy in meters
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  isInSchoolZone: {
    type: Boolean,
    default: false
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: null // For GPS device battery monitoring
  },
  signalStrength: {
    type: Number,
    default: null // GPS signal strength
  }
}, {
  timestamps: true
});

// Indexes for better query performance
locationSchema.index({ timestamp: -1 });
locationSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Geospatial index for location-based queries
locationSchema.index({ 
  coordinates: '2dsphere'
});

// Virtual for getting coordinates as GeoJSON
locationSchema.virtual('geoLocation').get(function() {
  return {
    type: 'Point',
    coordinates: [this.coordinates.longitude, this.coordinates.latitude]
  };
});

// Method to check if location is within school bounds
locationSchema.methods.isWithinSchoolBounds = function(schoolBounds) {
  const lat = this.coordinates.latitude;
  const lng = this.coordinates.longitude;
  
  // Simple bounding box check (can be enhanced with polygon checking)
  return lat >= schoolBounds.south && 
         lat <= schoolBounds.north && 
         lng >= schoolBounds.west && 
         lng <= schoolBounds.east;
};

module.exports = mongoose.model('Location', locationSchema);