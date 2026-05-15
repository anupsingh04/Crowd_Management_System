import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";
import { useNavigate } from "react-router-dom";

// Change this:
// const socket = io('http://localhost:5000');

// To this:
const socket = io(`http://${window.location.hostname}:5000`);

function App() {
  const maxCapacity = 100;
  const [alerts, setAlerts] = useState([]);
  // Inside your App component:
  const navigate = useNavigate();

  // Initial state with our Live Sector A, and mocked Sectors B-F
  const [sectors, setSectors] = useState({
    Sector_A: {
      count: 0,
      temp: 24,
      humidity: 50,
      raining: false,
      isLive: true,
    },
    Sector_B: {
      count: 45,
      temp: 25,
      humidity: 55,
      raining: false,
      isLive: false,
    },
    Sector_C: {
      count: 88,
      temp: 23,
      humidity: 60,
      raining: true,
      isLive: false,
    },
    Sector_D: {
      count: 12,
      temp: 22,
      humidity: 45,
      raining: false,
      isLive: false,
    },
    Sector_E: {
      count: 65,
      temp: 26,
      humidity: 50,
      raining: false,
      isLive: false,
    },
    Sector_F: {
      count: 95,
      temp: 27,
      humidity: 65,
      raining: true,
      isLive: false,
    },
  });

  useEffect(() => {
    // 1. Catch live updates from the ESP32
    socket.on("crowdUpdate", (data) => {
      setSectors((prev) => ({
        ...prev,
        [data.sector]: {
          ...prev[data.sector],
          count: data.count,
          temp: data.temp,
          humidity: data.humidity,
          raining: data.raining === "true" || data.raining === true,
        },
      }));
    });

    // 2. Catch Predictive AI Alerts
    socket.on("predictiveAlert", (data) => {
      setAlerts((prev) => {
        // Prevent duplicate alerts
        if (!prev.includes(data.message)) return [data.message, ...prev];
        return prev;
      });
    });

    // 3. Simulate background activity for Sectors B-F
    const simInterval = setInterval(() => {
      setSectors((prev) => {
        const nextState = { ...prev };
        Object.keys(nextState).forEach((key) => {
          if (!nextState[key].isLive) {
            // Randomly fluctuate counts by -2 to +3
            let newCount =
              nextState[key].count + Math.floor(Math.random() * 6) - 2;
            if (newCount < 0) newCount = 0;
            if (newCount > maxCapacity) newCount = maxCapacity;
            nextState[key].count = newCount;
          }
        });
        return nextState;
      });
    }, 4000); // Updates every 4 seconds

    return () => {
      socket.off("crowdUpdate");
      socket.off("predictiveAlert");
      clearInterval(simInterval);
    };
  }, []);

  const dismissAlert = (index) => {
    setAlerts(alerts.filter((_, i) => i !== index));
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Global Crowd Command Center</h1>
        <p>Live IoT & Predictive Analytics</p>
      </header>

      {/* Predictive Alert Banner */}
      {alerts.length > 0 && (
        <div className="alert-container">
          {alerts.map((alert, idx) => (
            <div key={idx} className="alert-banner">
              <span>{alert}</span>
              <button onClick={() => dismissAlert(idx)}>Dismiss</button>
            </div>
          ))}
        </div>
      )}

      <div className="grid-layout">
        {Object.entries(sectors).map(([name, data]) => {
          const percentage = (data.count / maxCapacity) * 100;
          let statusClass = "status-safe";
          if (percentage >= 85) statusClass = "status-critical";
          else if (percentage >= 60) statusClass = "status-warning";

          return (
            <div
              key={name}
              className={`sector-card ${data.isLive ? "live-node" : ""}`}
              onClick={() => navigate(`/sector/${name}`)}
              style={{ cursor: "pointer" }}
            >
              {data.isLive && (
                <div className="live-badge">🔴 LIVE ESP32 NODE</div>
              )}

              <h2>{name.replace("_", " ")}</h2>

              <div className="metric-primary">
                <span className={`count-text ${statusClass}`}>
                  {data.count}
                </span>
                <span className="capacity-text">/ {maxCapacity}</span>
              </div>

              <div className="progress-bar-bg">
                <div
                  className={`progress-bar-fill ${statusClass}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              <div className="environmental-data">
                <div className="env-stat">
                  <span className="env-label">Temp</span>
                  <span className="env-value">{data.temp.toFixed(1)}°C</span>
                </div>
                <div className="env-stat">
                  <span className="env-label">Humidity</span>
                  <span className="env-value">{data.humidity.toFixed(0)}%</span>
                </div>
                <div className="env-stat">
                  <span className="env-label">Weather</span>
                  <span className="env-value">
                    {data.raining ? "🌧️ Rain" : "☀️ Clear"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
