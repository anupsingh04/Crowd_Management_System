import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./MobileView.css";

// Change this:
// const socket = io('http://localhost:5000');

// To this:
const socket = io(`http://${window.location.hostname}:5000`);

function MobileView() {
  const maxCapacity = 100;
  const [sectors, setSectors] = useState({
    Sector_A: { count: 0, temp: 24, humidity: 50, raining: false },
    Sector_B: { count: 45, temp: 25, humidity: 55, raining: false },
    Sector_C: { count: 88, temp: 23, humidity: 60, raining: true },
    Sector_D: { count: 12, temp: 22, humidity: 45, raining: false },
    Sector_E: { count: 65, temp: 26, humidity: 50, raining: false },
    Sector_F: { count: 95, temp: 27, humidity: 65, raining: true },
  });
  const [targetSector, setTargetSector] = useState("Sector_A");

  useEffect(() => {
    // 3. Keep the live update listener so Sector A still reacts to your hand
    socket.on("crowdUpdate", (data) => {
      setSectors((prev) => ({
        ...prev,
        [data.sector]: { ...prev[data.sector], ...data },
      }));
    });

    return () => {
      socket.off("crowdUpdate");
    };
  }, []);

  const getBestAlternative = () => {
    let bestSector = null;
    let lowestCount = maxCapacity;

    Object.entries(sectors).forEach(([name, data]) => {
      if (
        name !== targetSector &&
        !data.raining &&
        data.count < maxCapacity * 0.8
      ) {
        if (data.count < lowestCount) {
          lowestCount = data.count;
          bestSector = name;
        }
      }
    });

    return bestSector;
  };

  const currentData = sectors[targetSector];
  const isCrowded = currentData && currentData.count / maxCapacity >= 0.8;
  const isRaining = currentData?.raining;
  const needsRedirection = isCrowded || isRaining;
  const alternative = getBestAlternative();

  if (!currentData)
    return <div className="mobile-app">Loading Live Data...</div>;

  return (
    <div className="mobile-app">
      <header className="mobile-header">
        <h1>Festival Map</h1>
      </header>

      {/* 1. Main Target View (The Highlighted Sector) */}
      <div className="status-card">
        <h2>{targetSector.replace("_", " ")}</h2>
        <div className="capacity-ring">
          <span
            className="ring-count"
            style={{ color: isCrowded ? "#ef4444" : "#3b82f6" }}
          >
            {currentData.count}
          </span>
          <span className="ring-max">/ {maxCapacity}</span>
        </div>
        <p className="weather-status">
          {isRaining ? "🌧️ Currently Raining" : "☀️ Clear Weather"}
        </p>
      </div>

      {/* 2. Routing Alerts */}
      {needsRedirection ? (
        <div className="redirection-alert">
          <h3>⚠️ Route Advisory</h3>
          <p>
            Your destination is currently {isCrowded ? "at high capacity" : ""}
            {isCrowded && isRaining ? " and " : ""}
            {isRaining ? "experiencing weather" : ""}.
          </p>
          {alternative ? (
            <div
              className="alternative-box"
              onClick={() => setTargetSector(alternative)}
            >
              <p>We recommend proceeding to:</p>
              <h4>{alternative.replace("_", " ")}</h4>
              <p className="alt-status">Tap to view this safe sector</p>
            </div>
          ) : (
            <p>All sectors are currently busy. Please expect delays.</p>
          )}
        </div>
      ) : (
        <div className="safe-alert">
          <h3>✅ Clear to Proceed</h3>
          <p>This sector has plenty of space and clear weather.</p>
        </div>
      )}

      {/* 3. The New Mini-Grid Selector */}
      <div className="mini-grid-container">
        <h3>Overview Map</h3>
        <div className="sector-grid-mini">
          {Object.entries(sectors).map(([name, data]) => {
            const isFull = data.count / maxCapacity >= 0.8;
            const hasWeather = data.raining;
            let statusDotClass = "dot-safe";

            if (isFull && hasWeather) statusDotClass = "dot-critical";
            else if (isFull || hasWeather) statusDotClass = "dot-warning";

            return (
              <div
                key={name}
                className={`mini-card ${name === targetSector ? "active-card" : ""}`}
                onClick={() => setTargetSector(name)}
              >
                <div className="mini-card-header">
                  <span className={`status-dot ${statusDotClass}`}></span>
                  <span className="mini-name">
                    {name.replace("Sector_", "")}
                  </span>
                </div>
                <div className="mini-count">
                  {data.count}
                  <span className="mini-max">/100</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MobileView;
