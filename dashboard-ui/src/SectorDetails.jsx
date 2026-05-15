import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

function SectorDetails() {
  const { sectorId } = useParams();
  const navigate = useNavigate();

  // State for the Graphs
  const [graphData, setGraphData] = useState(null);
  const [loadingGraphs, setLoadingGraphs] = useState(true);

  // State for the AI
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // 1. Fetch ONLY graph data when the page loads
  useEffect(() => {
    fetch(`http://localhost:5000/api/sector/${sectorId}/history`)
      .then((res) => res.json())
      .then((result) => {
        const formattedData = result.graphData.map((log) => ({
          ...log,
          time: new Date(log.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setGraphData(formattedData);
        setLoadingGraphs(false);
      })
      .catch((err) => console.error(err));
  }, [sectorId]);

  // 2. Trigger the AI API call only when button is clicked
  const handleGetInsight = () => {
    setLoadingInsight(true);

    // We use a POST request to trigger the AI generation route
    fetch(`http://localhost:5000/api/sector/${sectorId}/insight`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((result) => {
        setInsight(result.insight);
        setLoadingInsight(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingInsight(false);
      });
  };

  if (loadingGraphs)
    return (
      <div className="dashboard-container">
        <h2>Loading Sector Data...</h2>
      </div>
    );

  return (
    <div className="dashboard-container">
      <button
        className="back-btn"
        onClick={() => navigate("/")}
        style={{
          marginBottom: "2rem",
          padding: "0.5rem 1rem",
          cursor: "pointer",
        }}
      >
        ← Back to Dashboard
      </button>

      <header className="dashboard-header" style={{ marginBottom: "3rem" }}>
        <h1>{sectorId.replace("_", " ")} Analytics</h1>
      </header>

      {/* The Graphs (Rendered instantly on top) */}
      <div
        className="graphs-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "2rem",
          marginBottom: "3rem",
        }}
      >
        <div
          className="graph-card"
          style={{
            backgroundColor: "#1e293b",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #334155",
          }}
        >
          <h3>Crowd Density Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          className="graph-card"
          style={{
            backgroundColor: "#1e293b",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #334155",
          }}
        >
          <h3>Temperature Over Time (°C)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#ef4444"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* The AI Action Area (Below the graphs) */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        {!insight && (
          <button
            onClick={handleGetInsight}
            disabled={loadingInsight}
            style={{
              backgroundColor: loadingInsight ? "#6b21a8" : "#a855f7",
              color: "white",
              padding: "1rem 2.5rem",
              fontSize: "1.2rem",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: loadingInsight ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 6px -1px rgba(168, 85, 247, 0.4)",
            }}
          >
            {loadingInsight
              ? "✨ Analyzing Sector Data..."
              : "✨ Get AI Insights"}
          </button>
        )}

        {/* The Insight Box (Appears after button is clicked and API returns) */}
        {insight && (
          <div
            className="ai-insight-box"
            style={{
              backgroundColor: "#1e293b",
              padding: "2rem",
              borderRadius: "12px",
              borderLeft: "4px solid #a855f7",
              marginTop: "2rem",
              textAlign: "left",
              animation: "pulse 0.5s ease-out",
            }}
          >
            <h2 style={{ color: "#a855f7", marginTop: 0 }}>
              ✨ Security Directives
            </h2>
            <div
              style={{
                whiteSpace: "pre-line",
                lineHeight: "1.6",
                fontSize: "1.1rem",
              }}
            >
              {insight}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SectorDetails;
