# Attendance System API Reference

## Overview
This document provides a quick reference for all attendance-related API endpoints.

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication. Include the token in the header:
```
Authorization: Bearer <your-token>
```

---

## 📋 Endpoints

### 1. Mark Attendance by RFID
Mark a student as present using their RFID tag.

**Endpoint**: `POST /attendance/mark`  
**Access**: Public (for RFID hardware)  
**Request Body**:
```json
{
  "rfidTag": "RF12345"
}
```
**Success Response** (200):
```json
{
  "success": true,
  "message": "Student Aditya Kumar marked present via RFID. Welcome!",
  "data": {
    "studentId": "507f1f77bcf86cd799439011",
    "studentName": "Aditya Kumar",
    "rfidTag": "RF12345",
    "timestamp": "2025-01-23T08:30:00.000Z"
  }
}
```
**Error Response** (404):
```json
{
  "success": false,
  "message": "Student not found with this RFID tag"
}
```

---

### 2. Get Daily Attendance
Get attendance for all students for a specific date.

**Endpoint**: `GET /attendance/daily`  
**Access**: Private (requires `canViewReports` permission)  
**Query Parameters**:
- `date` (optional): Date in YYYY-MM-DD format (default: today)

**Example Request**:
```
GET /attendance/daily?date=2025-01-23
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "date": "2025-01-23",
    "totalStudents": 100,
    "presentCount": 85,
    "lateCount": 2,
    "absentCount": 13,
    "attendancePercentage": "87.00",
    "attendance": [
      {
        "_id": "...",
        "studentId": {
          "_id": "...",
          "name": "Aditya Kumar",
          "department": "CSE",
          "section": "A",
          "rfidTag": "RF12345"
        },
        "studentName": "Aditya Kumar",
        "rfidTag": "RF12345",
        "timestamp": "2025-01-23T08:30:00.000Z",
        "status": "present",
        "entryType": "rfid",
        "location": "Main Gate"
      }
    ]
  }
}
```

---

### 3. Get All Attendance Records
Get all attendance records with filters.

**Endpoint**: `GET /attendance`  
**Access**: Private (requires `canViewReports` permission)  
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)
- `date` (optional): Filter by specific date
- `studentId` (optional): Filter by student ID
- `status` (optional): Filter by status (present/absent/late)
- `entryType` (optional): Filter by entry type (rfid/manual/simulation)
- `startDate` (optional): Start date for range
- `endDate` (optional): End date for range
- `sortBy` (optional): Sort field (default: timestamp)
- `sortOrder` (optional): Sort order (desc/asc)

**Example Request**:
```
GET /attendance?page=1&limit=50&status=present&sortOrder=desc
```

---

### 4. Get Student Attendance History
Get attendance history for a specific student.

**Endpoint**: `GET /attendance/student/:studentId/history`  
**Access**: Private (requires `canViewReports` permission)  
**Query Parameters**:
- `days` (optional): Number of days to include (default: 30)

**Example Request**:
```
GET /attendance/student/507f1f77bcf86cd799439011/history?days=60
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Aditya Kumar",
      "studentId": "STU001",
      "section": "A",
      "department": "CSE"
    },
    "period": "30 days",
    "statistics": {
      "totalDays": 30,
      "presentDays": 26,
      "lateDays": 2,
      "absentDays": 2,
      "attendancePercentage": "93.33"
    },
    "history": [...]
  }
}
```

---

### 5. Get Student Attendance History (Date Range)
Get attendance history for a date range.

**Endpoint**: `GET /attendance/student/:studentId/history-range`  
**Access**: Private (requires `canViewReports` permission)  
**Query Parameters**:
- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

**Example Request**:
```
GET /attendance/student/507f1f77bcf86cd799439011/history-range?startDate=2025-01-01&endDate=2025-01-31
```

---

### 6. Get Daily Summary
Get daily attendance summary with statistics.

**Endpoint**: `GET /attendance/summary/daily`  
**Access**: Private (requires `canViewReports` permission)  
**Query Parameters**:
- `date` (optional): Date in YYYY-MM-DD format (default: today)

**Example Request**:
```
GET /attendance/summary/daily?date=2025-01-23
```

---

### 7. Get Attendance Statistics
Get attendance statistics overview.

**Endpoint**: `GET /attendance/stats/overview`  
**Access**: Private (requires `canViewReports` permission)  
**Query Parameters**:
- `days` (optional): Number of days (default: 30)

**Example Request**:
```
GET /attendance/stats/overview?days=60
```

---

### 8. Create Manual Attendance Entry
Manually mark a student's attendance.

**Endpoint**: `POST /attendance`  
**Access**: Private (requires `canManageStudents` permission)  
**Request Body**:
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "status": "present",
  "notes": "Late arrival",
  "location": "Main Gate"
}
```

---

### 9. Update Attendance Record
Update an existing attendance record.

**Endpoint**: `PUT /attendance/:id`  
**Access**: Private (requires `canManageStudents` permission)  
**Request Body**:
```json
{
  "status": "late",
  "notes": "Arrived at 9:15 AM",
  "location": "Main Gate"
}
```

---

### 10. Delete Attendance Record
Delete an attendance record.

**Endpoint**: `DELETE /attendance/:id`  
**Access**: Private (requires `canManageStudents` permission)

---

## 🔄 Manual Daily Reset

**Endpoint**: Available via scheduler utility  
**Description**: Resets all students' `isPresent` to `false` and marks absent students.  
**Automatically runs**: Every day at 00:00

To manually trigger (testing only):
```javascript
const { manualDailyReset } = require('./utils/scheduler');
const result = await manualDailyReset();
console.log(result);
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Example cURL Commands

### Mark Attendance
```bash
curl -X POST http://localhost:5000/api/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{"rfidTag": "RF12345"}'
```

### Get Daily Attendance
```bash
curl -X GET "http://localhost:5000/api/attendance/daily?date=2025-01-23" \
  -H "Authorization: Bearer <your-token>"
```

### Get Student History
```bash
curl -X GET "http://localhost:5000/api/attendance/student/STU001/history?days=30" \
  -H "Authorization: Bearer <your-token>"
```

---

## Notes

1. **Date Format**: Always use `YYYY-MM-DD` format for dates (e.g., `2025-01-23`)
2. **Timezone**: All timestamps are in UTC
3. **Pagination**: Use `page` and `limit` parameters for large datasets
4. **Sorting**: Default sort is by `timestamp` in descending order (newest first)
5. **Permissions**: Check your admin permissions before accessing protected endpoints

---

**Last Updated**: January 2025

