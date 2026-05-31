# Student Security & Tracking System 🛡️🎓

A comprehensive full-stack application designed to monitor student attendance and real-time location using RFID and GPS technologies. This system provides a robust administrative dashboard to track student entry/exit logs, generate attendance reports, and visualize real-time tracking data.

---

## ✨ Features

- **🔒 Secure Admin Dashboard**: Role-based access control with JWT authentication.
- **📡 Real-time RFID Integration**: WebSocket support for live RFID tag scanning and attendance logging.
- **📍 GPS Location Tracking**: Endpoints to capture and update student coordinates continuously.
- **📊 Comprehensive Reporting**: Generate customizable date-range reports for attendance and location history.
- **🧪 Simulation Panel**: Test the system locally using simulated RFID and GPS inputs without requiring physical hardware.
- **🎨 Modern UI**: Built with React and Tailwind CSS for a fully responsive, sleek user experience.

---

## 🛠️ Tech Stack

### Frontend
- **React.js (Vite)** - Fast, modern framework
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **Node.js & Express** - RESTful API server
- **MongoDB & Mongoose** - NoSQL database
- **WebSockets (`ws`)** - Real-time two-way communication for RFID scanners
- **JWT (JSON Web Tokens)** - Secure authentication

### Hardware Integration (Optional)
- **Arduino/ESP8266** sketches for GPS & RFID hardware endpoints are supported.

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a MongoDB Atlas cluster)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ahmadraza20021119/Student-Security-System-using-RFID-and-GPS.git
   cd Student-Security-System-using-RFID-and-GPS
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory based on the following template:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/student_security_db
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=24h
   NODE_ENV=development
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

---

## 💻 Running the Application

You will need two terminal windows to run both the frontend and backend development servers concurrently.

**1. Start the Backend Server**
```bash
cd backend
npm run dev
```
*The backend will run on `http://localhost:5000`.*

**2. Start the Frontend Server**
```bash
cd frontend
npm run dev
```
*The frontend will run on `http://localhost:3000` (or another port assigned by Vite).*

---

## 📁 Project Structure

```text
student_security_project/
├── backend/                  # Express.js REST API & WebSocket server
│   ├── controllers/          # Route logic
│   ├── middleware/           # Auth & Error handling
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API endpoint definitions
│   └── utils/                # Schedulers and helper functions
├── frontend/                 # React.js User Interface
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # Reusable UI components (Layout, Modals)
│       └── pages/            # Top-level page views (Dashboard, Login)
├── docs/                     # Project documentation & API references
└── hardware_gps/             # Arduino/C++ code for physical hardware integration
```

---

## 📚 API Documentation

Detailed API documentation can be found in the `docs/API_REFERENCE.md` file. It covers all REST endpoints, WebSocket payloads, and hardware integration instructions.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/ahmadraza20021119/Student-Security-System-using-RFID-and-GPS/issues).

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
