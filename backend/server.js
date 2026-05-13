require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const PORT = 5000;

// --- 1. Database Setup (MongoDB) ---
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI)
  .then(() => console.log("📦 Connected to MongoDB Atlas/Local successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// The Enterprise Schema (Handling all your new sensors)
const sectorSchema = new mongoose.Schema({
  sector: { type: String, required: true },
  count: { type: Number, required: true },
  temp: { type: Number, required: true },
  humidity: { type: Number, required: true },
  raining: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
});
const SectorLog = mongoose.model("SectorLog", sectorSchema);

// --- 2. WebSocket & Express Setup ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// In-memory state for immediate frontend syncing
let latestState = {};

io.on("connection", (socket) => {
  console.log(`💻 Dashboard connected: ${socket.id}`);
  socket.emit("initialState", latestState);
});

// --- 3. The ESP32 Receiver Endpoint ---
app.post("/api/updateCount", async (req, res) => {
  const { sector, count, temp, humidity, raining } = req.body;

  if (count !== undefined && sector) {
    // Save to memory for immediate WebSockets
    latestState[sector] = req.body;
    io.emit("crowdUpdate", req.body);

    try {
      // Save to MongoDB for the prediction engine
      const newLog = new SectorLog(req.body);
      await newLog.save();
      console.log(`✅ Logged -> ${sector}: ${count} people | Rain: ${raining}`);
    } catch (error) {
      console.error("DB Save Error:", error);
    }
    res.status(200).send("Data secured");
  } else {
    res.status(400).send("Bad Payload");
  }
});

// --- 4. THE PREDICTIVE ENGINE ---
const MAX_CAPACITY = 100; // Change this based on your prototype needs

setInterval(async () => {
  try {
    const sectorToCheck = "Sector_A";

    // Find the absolute latest log
    const currentData = await SectorLog.findOne({ sector: sectorToCheck }).sort(
      { timestamp: -1 },
    );

    // Find what the log was exactly 1 minute ago
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const pastData = await SectorLog.findOne({
      sector: sectorToCheck,
      timestamp: { $lte: oneMinuteAgo },
    }).sort({ timestamp: -1 });

    if (currentData && pastData) {
      // Calculate Velocity (People per minute)
      const deltaCount = currentData.count - pastData.count;

      if (deltaCount > 0) {
        // How many minutes until we hit MAX_CAPACITY?
        const minutesUntilFull =
          (MAX_CAPACITY - currentData.count) / deltaCount;

        // If it's going to fill up in less than 15 minutes, trigger an alarm!
        if (minutesUntilFull > 0 && minutesUntilFull <= 15) {
          const alertMsg = `⚠️ PREDICTIVE ALERT: ${sectorToCheck} is filling at ${deltaCount} people/min. Capacity expected in ${Math.round(minutesUntilFull)} minutes!`;

          console.log(alertMsg);

          // Broadcast the alert to the React UI
          io.emit("predictiveAlert", {
            sector: sectorToCheck,
            message: alertMsg,
            urgency: "high",
          });
        }
      }
    }
  } catch (error) {
    console.error("Prediction Engine Error:", error);
  }
}, 30000); // Runs every 30 seconds

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 AI Control Server running on http://0.0.0.0:${PORT}`);
});
