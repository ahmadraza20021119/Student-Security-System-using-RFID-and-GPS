#include <WiFi.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <TinyGPSPlus.h>
#include <ArduinoJson.h>

// ==============================
// 🔧 SETTINGS TO CHANGE
// ==============================
const char* ssid = "YOUR_WIFI_NAME";        // Enter your exact Wi-Fi name
const char* password = "YOUR_WIFI_PASSWORD"; // Enter your Wi-Fi password
const char* serverUrl = "http://YOUR_COMPUTER_IP:5000/api/gps/update"; // Replace with your laptop's Wi-Fi IP address

// The student we are tracking (Change this to test different students)
// You can use a real rfidTag from your MongoDB database
const char* rfidTag = "TEST_TAG_1"; 

// ==============================
// 📍 HARDWARE SETUP
// ==============================
// We use ESP32's Hardware Serial 2
// RX pin on ESP32 is GPIO 16 (Connects to GPS TX)
// TX pin on ESP32 is GPIO 17 (Connects to GPS RX)
#define RXD2 16
#define TXD2 17

HardwareSerial gpsSerial(2); 
TinyGPSPlus gps;

unsigned long lastTime = 0;
// Timer set to 10 seconds (10000 ms) to avoid spamming the server
unsigned long timerDelay = 10000; 

void setup() {
  Serial.begin(115200); // Standard serial for debugging in computer
  
  // Start GPS serial connection (Baud rate for NEO-6M is usually 9600)
  gpsSerial.begin(9600, SERIAL_8N1, RXD2, TXD2);
  
  Serial.println("\n--- GPS Tracker Starting ---");
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Wi-Fi Connected!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // 1. Read data from GPS module continuously
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // 2. Check if we have a valid location and if it's time to send
  if ((millis() - lastTime) > timerDelay) {
    
    if (gps.location.isValid()) {
      float latitude = gps.location.lat();
      float longitude = gps.location.lng();
      
      Serial.print("Got GPS Lock! Lat: ");
      Serial.print(latitude, 6);
      Serial.print(" | Lng: ");
      Serial.println(longitude, 6);

      // 3. Send to Server if connected to WiFi
      if(WiFi.status() == WL_CONNECTED){
        HTTPClient http;
        
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        // Create JSON payload
        StaticJsonDocument<200> doc;
        doc["rfidTag"] = rfidTag;
        doc["latitude"] = latitude;
        doc["longitude"] = longitude;

        String requestBody;
        serializeJson(doc, requestBody);

        Serial.println("Sending data to server: " + requestBody);
        
        // POST to backend
        int httpResponseCode = http.POST(requestBody);
        
        if (httpResponseCode > 0) {
          String response = http.getString();
          Serial.print("✅ Server Response code: ");
          Serial.println(httpResponseCode);
          Serial.println("   Message: " + response);
        } else {
          Serial.print("❌ Error sending data to server: ");
          Serial.println(httpResponseCode);
        }
        
        http.end(); // Free resources
      } else {
        Serial.println("❌ Wi-Fi Disconnected!");
      }
      
    } else {
      Serial.println("Waiting for valid GPS signal... (Make sure you are near a window)");
    }
    
    // Update timer
    lastTime = millis();
  }
}
