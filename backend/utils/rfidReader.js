const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

class RFIDReader {
  constructor() {
    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.onScanCallback = null;
  }

  /**
   * List all available serial ports
   */
  async listPorts() {
    try {
      const ports = await SerialPort.list();
      console.log('📡 Available Serial Ports:');
      ports.forEach((port, index) => {
        console.log(`${index + 1}. ${port.path} - ${port.manufacturer || 'Unknown'}`);
      });
      return ports;
    } catch (error) {
      console.error('Error listing ports:', error);
      return [];
    }
  }

  /**
   * Connect to RFID reader
   * @param {String} portPath - Serial port path (e.g., 'COM3', '/dev/ttyUSB0')
   * @param {Number} baudRate - Baud rate (default: 9600)
   */
  async connect(portPath, baudRate = 9600) {
    try {
      // If already connected, disconnect first
      if (this.isConnected) {
        await this.disconnect();
      }

      console.log(`🔌 Connecting to RFID reader on ${portPath}...`);

      // Create serial port connection
      this.port = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: false
      });

      // Create parser to read line-by-line
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      // Open the port
      await new Promise((resolve, reject) => {
        this.port.open((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      this.isConnected = true;
      console.log('✅ RFID reader connected successfully!');

      // Listen for data
      this.parser.on('data', async (data) => {
        const rfidTag = data.trim();
        if (rfidTag) {
          console.log(`🏷️  RFID Scanned: ${rfidTag}`);
          await this.handleRFIDScan(rfidTag);
        }
      });

      // Handle errors
      this.port.on('error', (err) => {
        console.error('❌ RFID Reader Error:', err.message);
        this.isConnected = false;
      });

      // Handle disconnect
      this.port.on('close', () => {
        console.log('🔌 RFID Reader disconnected');
        this.isConnected = false;
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to connect to RFID reader:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from RFID reader
   */
  async disconnect() {
    if (this.port && this.port.isOpen) {
      return new Promise((resolve) => {
        this.port.close((err) => {
          if (err) {
            console.error('Error closing port:', err);
          }
          this.isConnected = false;
          console.log('🔌 RFID reader disconnected');
          resolve();
        });
      });
    }
  }

  /**
   * Handle RFID scan
   * @param {String} rfidTag - Scanned RFID tag
   */
  async handleRFIDScan(rfidTag) {
    try {
      // Find student by RFID tag
      const student = await Student.findOne({ rfidTag, isActive: true });

      if (!student) {
        console.log(`⚠️  No student found with RFID: ${rfidTag}`);
        
        // Callback for frontend notification
        if (this.onScanCallback) {
          this.onScanCallback({
            success: false,
            rfidTag,
            message: 'Student not found with this RFID tag'
          });
        }
        return;
      }

      // Check if already marked present today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let attendanceRecord = await Attendance.findOne({
        studentId: student._id,
        timestamp: { $gte: today, $lt: tomorrow }
      });

      if (attendanceRecord) {
        // If an attendance record exists for today, update it to 'present' if it's not already
        if (attendanceRecord.status !== 'present') {
          attendanceRecord.status = 'present';
          attendanceRecord.entryType = 'rfid';
          attendanceRecord.timestamp = new Date(); // Update timestamp to latest scan
          await attendanceRecord.save();
          console.log(`✅ Attendance updated to 'present' for ${student.name}`);
        } else {
          console.log(`ℹ️  ${student.name} already marked present today`);
        }
      } else {
        // No attendance record for today, create a new one
        attendanceRecord = await Attendance.create({
          studentId: student._id,
          studentName: student.name,
          timestamp: new Date(),
          status: 'present',
          entryType: 'rfid',
          location: 'Main Gate'
        });
        console.log(`✅ Attendance marked for ${student.name}`);
      }

      // Callback for frontend notification
      if (this.onScanCallback) {
        this.onScanCallback({
          success: true,
          rfidTag,
          student: {
            id: student._id,
            name: student.name,
            studentId: student.studentId,
            class: student.class,
            section: student.class
          },
          attendance: {
            id: attendanceRecord._id,
            timestamp: attendanceRecord.timestamp,
            status: attendanceRecord.status
          },
          message: `Attendance marked for ${student.name}`
        });
      }

    } catch (error) {
      console.error('Error handling RFID scan:', error);
      
      if (this.onScanCallback) {
        this.onScanCallback({
          success: false,
          rfidTag,
          message: 'Error processing RFID scan',
          error: error.message
        });
      }
    }
  }

  /**
   * Set callback for scan events
   * @param {Function} callback - Callback function
   */
  onScan(callback) {
    this.onScanCallback = callback;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      port: this.port ? this.port.path : null
    };
  }

  /**
   * Test RFID reader by sending test data
   * @param {String} testRFID - Test RFID tag
   */
  async testScan(testRFID) {
    console.log(`🧪 Testing with RFID: ${testRFID}`);
    await this.handleRFIDScan(testRFID);
  }
}

// Export singleton instance
const rfidReader = new RFIDReader();
module.exports = rfidReader;