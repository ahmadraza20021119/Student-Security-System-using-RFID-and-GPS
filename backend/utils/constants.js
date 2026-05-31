// Application-wide constants

// User Roles
const ROLES = {
  ADMIN: 'admin',
  SECURITY: 'security',
  TEACHER: 'teacher',
  PRINCIPAL: 'principal'
};

// Attendance Status
const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

// Entry Types
const ENTRY_TYPES = {
  RFID: 'rfid',
  MANUAL: 'manual',
  SIMULATION: 'simulation'
};

// Gender Options
const GENDER = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other'
};

// Blood Groups
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Permissions
const PERMISSIONS = {
  CAN_MANAGE_STUDENTS: 'canManageStudents',
  CAN_VIEW_REPORTS: 'canViewReports',
  CAN_MANAGE_USERS: 'canManageUsers',
  CAN_EXPORT_DATA: 'canExportData'
};

// Default Role Permissions
const DEFAULT_PERMISSIONS = {
  [ROLES.ADMIN]: {
    canManageStudents: true,
    canViewReports: true,
    canManageUsers: true,
    canExportData: true
  },
  [ROLES.PRINCIPAL]: {
    canManageStudents: true,
    canViewReports: true,
    canManageUsers: false,
    canExportData: true
  },
  [ROLES.TEACHER]: {
    canManageStudents: false,
    canViewReports: true,
    canManageUsers: false,
    canExportData: true
  },
  [ROLES.SECURITY]: {
    canManageStudents: false,
    canViewReports: true,
    canManageUsers: false,
    canExportData: false
  }
};

// File Upload Limits
const FILE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Validation Rules
const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  STUDENT_ID_MIN_LENGTH: 3,
  STUDENT_ID_MAX_LENGTH: 20,
  RFID_TAG_MIN_LENGTH: 4,
  RFID_TAG_MAX_LENGTH: 50,
  ADDRESS_MIN_LENGTH: 10,
  ADDRESS_MAX_LENGTH: 500
};

// School Boundaries (for geofencing)
const SCHOOL_BOUNDS = {
  NORTH: parseFloat(process.env.SCHOOL_BOUNDS_NORTH) || 12.9716,
  SOUTH: parseFloat(process.env.SCHOOL_BOUNDS_SOUTH) || 12.9640,
  EAST: parseFloat(process.env.SCHOOL_BOUNDS_EAST) || 77.5946,
  WEST: parseFloat(process.env.SCHOOL_BOUNDS_WEST) || 77.5870
};

// Time Configurations
const TIME_CONFIG = {
  SCHOOL_START_TIME: '08:00',
  SCHOOL_END_TIME: '15:00',
  LATE_THRESHOLD_MINUTES: 15, // Students arriving after 15 mins are marked late
  JWT_EXPIRY: process.env.JWT_EXPIRE || '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  PASSWORD_RESET_EXPIRY: '1h'
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100
};

// Response Messages
const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login successful',
    LOGOUT: 'Logged out successfully',
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    RESTORED: 'Restored successfully'
  },
  ERROR: {
    INVALID_CREDENTIALS: 'Invalid credentials',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    NOT_FOUND: 'Resource not found',
    ALREADY_EXISTS: 'Resource already exists',
    VALIDATION_ERROR: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database error',
    ACCOUNT_LOCKED: 'Account is locked due to too many failed login attempts',
    ACCOUNT_INACTIVE: 'Account is inactive',
    TOKEN_EXPIRED: 'Token has expired',
    INVALID_TOKEN: 'Invalid token'
  }
};

// HTTP Status Codes
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Report Types
const REPORT_TYPES = {
  ATTENDANCE: 'attendance',
  STUDENTS: 'students',
  LOCATIONS: 'locations',
  DAILY_SUMMARY: 'daily_summary',
  MONTHLY_SUMMARY: 'monthly_summary'
};

// Report Formats
const REPORT_FORMATS = {
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json'
};

// Database Collections
const COLLECTIONS = {
  STUDENTS: 'students',
  ATTENDANCE: 'attendances',
  LOCATIONS: 'locations',
  ADMINS: 'admins'
};

// MongoDB Connection States
const DB_STATES = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3
};

// Hardware Configuration
const HARDWARE_CONFIG = {
  RFID_READER_PORT: process.env.RFID_READER_PORT || '/dev/ttyUSB0',
  RFID_BAUD_RATE: parseInt(process.env.RFID_BAUD_RATE) || 9600,
  GPS_MODULE_PORT: process.env.GPS_MODULE_PORT || '/dev/ttyUSB1',
  GPS_BAUD_RATE: parseInt(process.env.GPS_BAUD_RATE) || 9600,
  LOCATION_UPDATE_INTERVAL: 5000 // 5 seconds
};

// Notification Types
const NOTIFICATION_TYPES = {
  ATTENDANCE_MARKED: 'attendance_marked',
  STUDENT_ABSENT: 'student_absent',
  OUT_OF_BOUNDS: 'out_of_bounds',
  EMERGENCY: 'emergency',
  SYSTEM_ALERT: 'system_alert'
};

// Log Levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// API Rate Limiting
const RATE_LIMITS = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  SKIP_SUCCESSFUL_REQUESTS: false,
  SKIP_FAILED_REQUESTS: false
};

// Cache Configuration
const CACHE_CONFIG = {
  TTL: 60 * 5, // 5 minutes
  CHECK_PERIOD: 60, // Check for expired keys every 60 seconds
  MAX_KEYS: 100
};

// Regular Expressions for Validation
const REGEX = {
  USERNAME: /^[a-zA-Z0-9_.-]+$/,
  STUDENT_ID: /^[A-Z0-9]+$/,
  RFID_TAG: /^[A-Z0-9]+$/,
  NAME: /^[a-zA-Z\s.'-]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// Environment
const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging'
};

// Current Environment
const NODE_ENV = process.env.NODE_ENV || ENVIRONMENT.DEVELOPMENT;
const IS_PRODUCTION = NODE_ENV === ENVIRONMENT.PRODUCTION;
const IS_DEVELOPMENT = NODE_ENV === ENVIRONMENT.DEVELOPMENT;

module.exports = {
  ROLES,
  ATTENDANCE_STATUS,
  ENTRY_TYPES,
  GENDER,
  BLOOD_GROUPS,
  PERMISSIONS,
  DEFAULT_PERMISSIONS,
  FILE_LIMITS,
  VALIDATION,
  SCHOOL_BOUNDS,
  TIME_CONFIG,
  PAGINATION,
  MESSAGES,
  STATUS_CODES,
  REPORT_TYPES,
  REPORT_FORMATS,
  COLLECTIONS,
  DB_STATES,
  HARDWARE_CONFIG,
  NOTIFICATION_TYPES,
  LOG_LEVELS,
  RATE_LIMITS,
  CACHE_CONFIG,
  REGEX,
  ENVIRONMENT,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT
};