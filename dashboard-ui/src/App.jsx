import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";

// IMPORTANT: Replace this with your laptop's IP address if testing from a phone,
// otherwise 'http://localhost:5000' works fine for local browser testing.
const socket = io("http://localhost:5000");

function App() {
  const [sectors, setSectors] = useState({});
  const maxCapacity = 10; // Set a small max capacity for desk testing

  useEffect(() => {
    // Catch the initial state when connecting
    socket.on("initialState", (state) => {
      setSectors(state);
    });

    // Catch the live updates from the ESP32
    socket.on("crowdUpdate", (data) => {
      setSectors((prev) => ({
        ...prev,
        [data.sector]: data.count,
      }));
    });

    return () => {
      socket.off("initialState");
      socket.off("crowdUpdate");
    };
  }, []);

  return (
    <div className="dashboard">
      <h1>Live Crowd Management System</h1>
      <p>Real-time sector monitoring via ESP32 & WebSockets</p>

      <div className="sector-grid">
        {Object.entries(sectors).map(([sectorName, count]) => {
          // Logic for dynamic warnings
          const percentage = (count / maxCapacity) * 100;
          let statusColor = "#4ade80"; // Green
          let statusText = "Safe";

          if (percentage >= 80) {
            statusColor = "#ef4444"; // Red
            statusText = "Overcrowded!";
          } else if (percentage >= 50) {
            statusColor = "#facc15"; // Yellow
            statusText = "Filling Up";
          }

          return (
            <div
              key={sectorName}
              className="sector-card"
              style={{ borderColor: statusColor }}
            >
              <h2>{sectorName.replace("_", " ")}</h2>
              <div className="count" style={{ color: statusColor }}>
                {count} <span className="max-count">/ {maxCapacity}</span>
              </div>
              <div
                className="status"
                style={{ backgroundColor: statusColor, color: "#111" }}
              >
                {statusText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
