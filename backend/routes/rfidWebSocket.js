const express = require("express");
const rfidReader = require("../utils/rfidReader");
const { auth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

// Store active WebSocket clients
let wsClients = [];

/**
 * Initialize WebSocket for RFID real-time updates
 * @param {Object} wss - WebSocket Server instance
 */
const initializeRFIDWebSocket = (wss) => {
  console.log("✅ RFID WebSocket service initialized");

  // Broadcast RFID scans to all connected WebSocket clients
  rfidReader.onScan(async (scanData) => {
    console.log("📡 RFID scan detected:", scanData);
    
    // Call handleRFIDScan to process attendance in the backend
    await rfidReader.handleRFIDScan(scanData.rfidTag);

    const payload = JSON.stringify({
      type: "rfid_scan",
      data: scanData,
      timestamp: new Date(),
    });

    wsClients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
  });

  // Handle new WebSocket client connection
  wss.on("connection", (ws, req) => {
    console.log("🔌 New WebSocket client connected");
    wsClients.push(ws);

    // Confirm connection
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "Connected to RFID reader service",
      })
    );

    // Heartbeat to prevent timeouts
    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));

    // Handle messages from client (optional)
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    // Handle disconnect
    ws.on("close", () => {
      console.log("❌ WebSocket client disconnected");
      wsClients = wsClients.filter((client) => client !== ws);
    });

    // Handle errors
    ws.on("error", (err) => {
      console.error("⚠️ WebSocket error:", err.message);
    });
  });

  // Clean up dead connections every 30s
  const interval = setInterval(() => {
    wsClients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));
};

/* -------------------------------------------------------------------------- */
/*                            Express REST Endpoints                          */
/* -------------------------------------------------------------------------- */

// @desc List available serial ports
router.get(
  "/ports",
  auth,
  asyncHandler(async (req, res) => {
    const ports = await rfidReader.listPorts();
    res.json({
      success: true,
      data: ports.map((port) => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        vendorId: port.vendorId,
        productId: port.productId,
      })),
    });
  })
);

// @desc Connect to RFID reader
router.post(
  "/connect",
  auth,
  asyncHandler(async (req, res) => {
    const { port, baudRate = 9600 } = req.body;
    if (!port)
      return res.status(400).json({
        success: false,
        message: "Port path is required",
      });

    const connected = await rfidReader.connect(port, baudRate);
    if (connected) {
      res.json({
        success: true,
        message: `Connected to RFID reader on ${port}`,
        status: rfidReader.getStatus(),
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to connect to RFID reader",
      });
    }
  })
);

// @desc Disconnect RFID reader
router.post(
  "/disconnect",
  auth,
  asyncHandler(async (req, res) => {
    await rfidReader.disconnect();
    res.json({
      success: true,
      message: "RFID reader disconnected",
      status: rfidReader.getStatus(),
    });
  })
);

// @desc Get RFID reader status
router.get(
  "/status",
  auth,
  asyncHandler(async (req, res) => {
    const status = rfidReader.getStatus();
    res.json({
      success: true,
      data: status,
    });
  })
);

// @desc Test RFID scan (simulate)
router.post(
  "/test",
  auth,
  asyncHandler(async (req, res) => {
    const { rfidTag } = req.body;
    if (!rfidTag)
      return res.status(400).json({
        success: false,
        message: "RFID tag is required",
      });

    await rfidReader.testScan(rfidTag);
    res.json({
      success: true,
      message: "Test scan initiated",
    });
  })
);

module.exports = { router, initializeRFIDWebSocket };
