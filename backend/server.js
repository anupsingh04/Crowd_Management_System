const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const PORT = 5000;

// Create an HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow your React app to connect
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory state for multiple sectors
let crowdState = {
  Sector_A: 0,
};

// Listen for WebSocket connections from your React Dashboard
io.on("connection", (socket) => {
  console.log(`💻 Dashboard connected: ${socket.id}`);

  // Immediately send the current state to the newly connected dashboard
  socket.emit("initialState", crowdState);

  socket.on("disconnect", () => {
    console.log(`❌ Dashboard disconnected: ${socket.id}`);
  });
});

// The endpoint the ESP32 hits
app.post("/api/updateCount", (req, res) => {
  const { sector, count, temp, humidity, raining } = req.body;

  if (count !== undefined && sector) {
    // Update the server's memory
    crowdState[sector] = count;

    console.log(
      `✅ Update -> Sector: ${sector} | People: ${count} | Temp: ${temp}°C | Rain: ${raining}`,
    );

    // 🚀 THE MAGIC: Broadcast the update instantly to all connected React clients
    io.emit("crowdUpdate", req.body);

    res.status(200).send("Data received and broadcasted");
  } else {
    res.status(400).send("Bad Request");
  }
});

// Run the server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Real-time Server running on http://0.0.0.0:${PORT}`);
});
